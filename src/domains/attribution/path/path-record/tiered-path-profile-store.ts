import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPathProfile } from "./tiered-path-profile.js";

/** Keeps tiered path profiles by code. */
export interface TieredPathProfileStore {
  find(code: string): TieredPathProfile | undefined;
  save(item: TieredPathProfile): void;
  remove(code: string): boolean;
  list(): TieredPathProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPathProfileStore implements TieredPathProfileStore {
  items: Map<string, TieredPathProfile>;
  order: string[];

  constructor(items: Map<string, TieredPathProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPathProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPathProfile): void {
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

  list(): TieredPathProfile[] {
    const out: TieredPathProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPathProfileStore(): TieredPathProfileStore {
  return new MemoryTieredPathProfileStore(new Map<string, TieredPathProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPathProfileStore implements TieredPathProfileStore {
  inner: TieredPathProfileStore;
  cache: cache.TtlCache<TieredPathProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPathProfileStore,
    cacheValue: cache.TtlCache<TieredPathProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPathProfile | undefined {
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

  save(item: TieredPathProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPathProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredPathProfileStore(inner: TieredPathProfileStore, ttl: number, clockValue: clock.Clock): TieredPathProfileStore {
  return new CachedTieredPathProfileStore(inner, cache.newTtlCache<TieredPathProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered path profiles. Empty fields match all. */
export class TieredPathProfileQuery {
  unit: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minClicks: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPathProfile): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPathProfile[]): TieredPathProfile[] {
    const matched = collections.filter(items, (candidate: TieredPathProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPathProfiles(store: TieredPathProfileStore, query: TieredPathProfileQuery): TieredPathProfile[] {
  return query.apply(store.list());
}
