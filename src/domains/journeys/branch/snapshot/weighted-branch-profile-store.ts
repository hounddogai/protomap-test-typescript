import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedBranchProfile } from "./weighted-branch-profile.js";

/** Keeps weighted branch profiles by code. */
export interface WeightedBranchProfileStore {
  find(code: string): WeightedBranchProfile | undefined;
  save(item: WeightedBranchProfile): void;
  remove(code: string): boolean;
  list(): WeightedBranchProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedBranchProfileStore implements WeightedBranchProfileStore {
  items: Map<string, WeightedBranchProfile>;
  order: string[];

  constructor(items: Map<string, WeightedBranchProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedBranchProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedBranchProfile): void {
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

  list(): WeightedBranchProfile[] {
    const out: WeightedBranchProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedBranchProfileStore(): WeightedBranchProfileStore {
  return new MemoryWeightedBranchProfileStore(new Map<string, WeightedBranchProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedBranchProfileStore implements WeightedBranchProfileStore {
  inner: WeightedBranchProfileStore;
  cache: cache.TtlCache<WeightedBranchProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedBranchProfileStore,
    cacheValue: cache.TtlCache<WeightedBranchProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedBranchProfile | undefined {
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

  save(item: WeightedBranchProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedBranchProfile[] {
    return this.inner.list();
  }
}

export function newCachedWeightedBranchProfileStore(inner: WeightedBranchProfileStore, ttl: number, clockValue: clock.Clock): WeightedBranchProfileStore {
  return new CachedWeightedBranchProfileStore(
    inner,
    cache.newTtlCache<WeightedBranchProfile>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted branch profiles. Empty fields match all. */
export class WeightedBranchProfileQuery {
  utmSource: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSendAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedBranchProfile): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedBranchProfile[]): WeightedBranchProfile[] {
    const matched = collections.filter(items, (candidate: WeightedBranchProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedBranchProfiles(store: WeightedBranchProfileStore, query: WeightedBranchProfileQuery): WeightedBranchProfile[] {
  return query.apply(store.list());
}
