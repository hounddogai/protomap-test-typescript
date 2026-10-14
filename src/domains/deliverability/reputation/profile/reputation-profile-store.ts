import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationProfile } from "./reputation-profile.js";

/** Keeps reputation profiles by code. */
export interface ReputationProfileStore {
  find(code: string): ReputationProfile | undefined;
  save(item: ReputationProfile): void;
  remove(code: string): boolean;
  list(): ReputationProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationProfileStore implements ReputationProfileStore {
  items: Map<string, ReputationProfile>;
  order: string[];

  constructor(items: Map<string, ReputationProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationProfile): void {
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

  list(): ReputationProfile[] {
    const out: ReputationProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationProfileStore(): ReputationProfileStore {
  return new MemoryReputationProfileStore(new Map<string, ReputationProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationProfileStore implements ReputationProfileStore {
  inner: ReputationProfileStore;
  cache: cache.TtlCache<ReputationProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationProfileStore,
    cacheValue: cache.TtlCache<ReputationProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationProfile | undefined {
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

  save(item: ReputationProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationProfile[] {
    return this.inner.list();
  }
}

export function newCachedReputationProfileStore(inner: ReputationProfileStore, ttl: number, clockValue: clock.Clock): ReputationProfileStore {
  return new CachedReputationProfileStore(inner, cache.newTtlCache<ReputationProfile>(64, ttl, clockValue), 0, 0);
}

/** Selects reputation profiles. Empty fields match all. */
export class ReputationProfileQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationProfile): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationProfile[]): ReputationProfile[] {
    const matched = collections.filter(items, (candidate: ReputationProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationProfiles(store: ReputationProfileStore, query: ReputationProfileQuery): ReputationProfile[] {
  return query.apply(store.list());
}
