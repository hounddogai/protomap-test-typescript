import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBranchProfile } from "./tiered-branch-profile.js";

/** Keeps tiered branch profiles by code. */
export interface TieredBranchProfileStore {
  find(code: string): TieredBranchProfile | undefined;
  save(item: TieredBranchProfile): void;
  remove(code: string): boolean;
  list(): TieredBranchProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBranchProfileStore implements TieredBranchProfileStore {
  items: Map<string, TieredBranchProfile>;
  order: string[];

  constructor(items: Map<string, TieredBranchProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBranchProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBranchProfile): void {
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

  list(): TieredBranchProfile[] {
    const out: TieredBranchProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBranchProfileStore(): TieredBranchProfileStore {
  return new MemoryTieredBranchProfileStore(new Map<string, TieredBranchProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBranchProfileStore implements TieredBranchProfileStore {
  inner: TieredBranchProfileStore;
  cache: cache.TtlCache<TieredBranchProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBranchProfileStore,
    cacheValue: cache.TtlCache<TieredBranchProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBranchProfile | undefined {
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

  save(item: TieredBranchProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBranchProfile[] {
    return this.inner.list();
  }
}

export function newCachedTieredBranchProfileStore(inner: TieredBranchProfileStore, ttl: number, clockValue: clock.Clock): TieredBranchProfileStore {
  return new CachedTieredBranchProfileStore(inner, cache.newTtlCache<TieredBranchProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects tiered branch profiles. Empty fields match all. */
export class TieredBranchProfileQuery {
  country: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minGraceDays: number, statuses: string[], limit: number) {
    this.country = country;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBranchProfile): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBranchProfile[]): TieredBranchProfile[] {
    const matched = collections.filter(items, (candidate: TieredBranchProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBranchProfiles(store: TieredBranchProfileStore, query: TieredBranchProfileQuery): TieredBranchProfile[] {
  return query.apply(store.list());
}
