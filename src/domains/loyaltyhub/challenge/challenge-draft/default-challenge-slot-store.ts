import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultChallengeSlot } from "./default-challenge-slot.js";

/** Keeps default challenge slots by code. */
export interface DefaultChallengeSlotStore {
  find(code: string): DefaultChallengeSlot | undefined;
  save(item: DefaultChallengeSlot): void;
  remove(code: string): boolean;
  list(): DefaultChallengeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultChallengeSlotStore implements DefaultChallengeSlotStore {
  items: Map<string, DefaultChallengeSlot>;
  order: string[];

  constructor(items: Map<string, DefaultChallengeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultChallengeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultChallengeSlot): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): DefaultChallengeSlot[] {
    const out: DefaultChallengeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultChallengeSlotStore(): DefaultChallengeSlotStore {
  return new MemoryDefaultChallengeSlotStore(new Map<string, DefaultChallengeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultChallengeSlotStore implements DefaultChallengeSlotStore {
  inner: DefaultChallengeSlotStore;
  cache: cache.TtlCache<DefaultChallengeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultChallengeSlotStore,
    cacheValue: cache.TtlCache<DefaultChallengeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultChallengeSlot | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: DefaultChallengeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultChallengeSlot[] {
    return this.inner.list();
  }
}

export function newCachedDefaultChallengeSlotStore(inner: DefaultChallengeSlotStore, ttl: number, clockValue: clock.Clock): DefaultChallengeSlotStore {
  return new CachedDefaultChallengeSlotStore(
    inner,
    cache.newTtlCache<DefaultChallengeSlot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default challenge slots. Empty fields match all. */
export class DefaultChallengeSlotQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultChallengeSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultChallengeSlot[]): DefaultChallengeSlot[] {
    const matched = collections.filter(items, (candidate: DefaultChallengeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultChallengeSlots(store: DefaultChallengeSlotStore, query: DefaultChallengeSlotQuery): DefaultChallengeSlot[] {
  return query.apply(store.list());
}
