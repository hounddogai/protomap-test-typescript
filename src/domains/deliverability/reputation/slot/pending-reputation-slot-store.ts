import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingReputationSlot } from "./pending-reputation-slot.js";

/** Keeps pending reputation slots by code. */
export interface PendingReputationSlotStore {
  find(code: string): PendingReputationSlot | undefined;
  save(item: PendingReputationSlot): void;
  remove(code: string): boolean;
  list(): PendingReputationSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingReputationSlotStore implements PendingReputationSlotStore {
  items: Map<string, PendingReputationSlot>;
  order: string[];

  constructor(items: Map<string, PendingReputationSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingReputationSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingReputationSlot): void {
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

  list(): PendingReputationSlot[] {
    const out: PendingReputationSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingReputationSlotStore(): PendingReputationSlotStore {
  return new MemoryPendingReputationSlotStore(new Map<string, PendingReputationSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingReputationSlotStore implements PendingReputationSlotStore {
  inner: PendingReputationSlotStore;
  cache: cache.TtlCache<PendingReputationSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingReputationSlotStore,
    cacheValue: cache.TtlCache<PendingReputationSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingReputationSlot | undefined {
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

  save(item: PendingReputationSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingReputationSlot[] {
    return this.inner.list();
  }
}

export function newCachedPendingReputationSlotStore(inner: PendingReputationSlotStore, ttl: number, clockValue: clock.Clock): PendingReputationSlotStore {
  return new CachedPendingReputationSlotStore(
    inner,
    cache.newTtlCache<PendingReputationSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reputation slots. Empty fields match all. */
export class PendingReputationSlotQuery {
  utmSource: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minImpressions: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingReputationSlot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingReputationSlot[]): PendingReputationSlot[] {
    const matched = collections.filter(items, (candidate: PendingReputationSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingReputationSlots(store: PendingReputationSlotStore, query: PendingReputationSlotQuery): PendingReputationSlot[] {
  return query.apply(store.list());
}
