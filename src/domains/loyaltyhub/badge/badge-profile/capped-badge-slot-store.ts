import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBadgeSlot } from "./capped-badge-slot.js";

/** Keeps capped badge slots by code. */
export interface CappedBadgeSlotStore {
  find(code: string): CappedBadgeSlot | undefined;
  save(item: CappedBadgeSlot): void;
  remove(code: string): boolean;
  list(): CappedBadgeSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBadgeSlotStore implements CappedBadgeSlotStore {
  items: Map<string, CappedBadgeSlot>;
  order: string[];

  constructor(items: Map<string, CappedBadgeSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBadgeSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBadgeSlot): void {
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

  list(): CappedBadgeSlot[] {
    const out: CappedBadgeSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBadgeSlotStore(): CappedBadgeSlotStore {
  return new MemoryCappedBadgeSlotStore(new Map<string, CappedBadgeSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBadgeSlotStore implements CappedBadgeSlotStore {
  inner: CappedBadgeSlotStore;
  cache: cache.TtlCache<CappedBadgeSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBadgeSlotStore,
    cacheValue: cache.TtlCache<CappedBadgeSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBadgeSlot | undefined {
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

  save(item: CappedBadgeSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBadgeSlot[] {
    return this.inner.list();
  }
}

export function newCachedCappedBadgeSlotStore(inner: CappedBadgeSlotStore, ttl: number, clockValue: clock.Clock): CappedBadgeSlotStore {
  return new CachedCappedBadgeSlotStore(inner, cache.newTtlCache<CappedBadgeSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects capped badge slots. Empty fields match all. */
export class CappedBadgeSlotQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBadgeSlot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBadgeSlot[]): CappedBadgeSlot[] {
    const matched = collections.filter(items, (candidate: CappedBadgeSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBadgeSlots(store: CappedBadgeSlotStore, query: CappedBadgeSlotQuery): CappedBadgeSlot[] {
  return query.apply(store.list());
}
