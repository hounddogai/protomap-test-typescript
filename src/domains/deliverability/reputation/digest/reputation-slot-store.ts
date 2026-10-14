import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationSlot } from "./reputation-slot.js";

/** Keeps reputation slots by code. */
export interface ReputationSlotStore {
  find(code: string): ReputationSlot | undefined;
  save(item: ReputationSlot): void;
  remove(code: string): boolean;
  list(): ReputationSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationSlotStore implements ReputationSlotStore {
  items: Map<string, ReputationSlot>;
  order: string[];

  constructor(items: Map<string, ReputationSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationSlot): void {
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

  list(): ReputationSlot[] {
    const out: ReputationSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationSlotStore(): ReputationSlotStore {
  return new MemoryReputationSlotStore(new Map<string, ReputationSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationSlotStore implements ReputationSlotStore {
  inner: ReputationSlotStore;
  cache: cache.TtlCache<ReputationSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationSlotStore,
    cacheValue: cache.TtlCache<ReputationSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationSlot | undefined {
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

  save(item: ReputationSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationSlot[] {
    return this.inner.list();
  }
}

export function newCachedReputationSlotStore(inner: ReputationSlotStore, ttl: number, clockValue: clock.Clock): ReputationSlotStore {
  return new CachedReputationSlotStore(inner, cache.newTtlCache<ReputationSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation slots. Empty fields match all. */
export class ReputationSlotQuery {
  title: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minVersion: number, statuses: string[], limit: number) {
    this.title = title;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationSlot[]): ReputationSlot[] {
    const matched = collections.filter(items, (candidate: ReputationSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationSlots(store: ReputationSlotStore, query: ReputationSlotQuery): ReputationSlot[] {
  return query.apply(store.list());
}
