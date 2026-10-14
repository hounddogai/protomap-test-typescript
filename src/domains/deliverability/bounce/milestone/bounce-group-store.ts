import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceGroup } from "./bounce-group.js";

/** Keeps bounce groups by code. */
export interface BounceGroupStore {
  find(code: string): BounceGroup | undefined;
  save(item: BounceGroup): void;
  remove(code: string): boolean;
  list(): BounceGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceGroupStore implements BounceGroupStore {
  items: Map<string, BounceGroup>;
  order: string[];

  constructor(items: Map<string, BounceGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceGroup): void {
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

  list(): BounceGroup[] {
    const out: BounceGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceGroupStore(): BounceGroupStore {
  return new MemoryBounceGroupStore(new Map<string, BounceGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceGroupStore implements BounceGroupStore {
  inner: BounceGroupStore;
  cache: cache.TtlCache<BounceGroup>;
  hits: number;
  misses: number;

  constructor(inner: BounceGroupStore, cacheValue: cache.TtlCache<BounceGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceGroup | undefined {
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

  save(item: BounceGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceGroup[] {
    return this.inner.list();
  }
}

export function newCachedBounceGroupStore(inner: BounceGroupStore, ttl: number, clockValue: clock.Clock): BounceGroupStore {
  return new CachedBounceGroupStore(inner, cache.newTtlCache<BounceGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce groups. Empty fields match all. */
export class BounceGroupQuery {
  country: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minConversionRate: number, statuses: string[], limit: number) {
    this.country = country;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceGroup): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceGroup[]): BounceGroup[] {
    const matched = collections.filter(items, (candidate: BounceGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceGroups(store: BounceGroupStore, query: BounceGroupQuery): BounceGroup[] {
  return query.apply(store.list());
}
