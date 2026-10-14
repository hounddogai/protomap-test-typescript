import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultSuppressionSlot } from "./default-suppression-slot.js";

/** Keeps default suppression slots by code. */
export interface DefaultSuppressionSlotStore {
  find(code: string): DefaultSuppressionSlot | undefined;
  save(item: DefaultSuppressionSlot): void;
  remove(code: string): boolean;
  list(): DefaultSuppressionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultSuppressionSlotStore implements DefaultSuppressionSlotStore {
  items: Map<string, DefaultSuppressionSlot>;
  order: string[];

  constructor(items: Map<string, DefaultSuppressionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultSuppressionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultSuppressionSlot): void {
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

  list(): DefaultSuppressionSlot[] {
    const out: DefaultSuppressionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultSuppressionSlotStore(): DefaultSuppressionSlotStore {
  return new MemoryDefaultSuppressionSlotStore(new Map<string, DefaultSuppressionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultSuppressionSlotStore implements DefaultSuppressionSlotStore {
  inner: DefaultSuppressionSlotStore;
  cache: cache.TtlCache<DefaultSuppressionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultSuppressionSlotStore,
    cacheValue: cache.TtlCache<DefaultSuppressionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultSuppressionSlot | undefined {
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

  save(item: DefaultSuppressionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultSuppressionSlot[] {
    return this.inner.list();
  }
}

export function newCachedDefaultSuppressionSlotStore(inner: DefaultSuppressionSlotStore, ttl: number, clockValue: clock.Clock): DefaultSuppressionSlotStore {
  return new CachedDefaultSuppressionSlotStore(
    inner,
    cache.newTtlCache<DefaultSuppressionSlot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default suppression slots. Empty fields match all. */
export class DefaultSuppressionSlotQuery {
  channel: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultSuppressionSlot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultSuppressionSlot[]): DefaultSuppressionSlot[] {
    const matched = collections.filter(items, (candidate: DefaultSuppressionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultSuppressionSlots(store: DefaultSuppressionSlotStore, query: DefaultSuppressionSlotQuery): DefaultSuppressionSlot[] {
  return query.apply(store.list());
}
