import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalTierPolicy } from "./seasonal-tier-policy.js";

/** Keeps seasonal tier policies by code. */
export interface SeasonalTierPolicyStore {
  find(code: string): SeasonalTierPolicy | undefined;
  save(item: SeasonalTierPolicy): void;
  remove(code: string): boolean;
  list(): SeasonalTierPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalTierPolicyStore implements SeasonalTierPolicyStore {
  items: Map<string, SeasonalTierPolicy>;
  order: string[];

  constructor(items: Map<string, SeasonalTierPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalTierPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalTierPolicy): void {
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

  list(): SeasonalTierPolicy[] {
    const out: SeasonalTierPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalTierPolicyStore(): SeasonalTierPolicyStore {
  return new MemorySeasonalTierPolicyStore(new Map<string, SeasonalTierPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalTierPolicyStore implements SeasonalTierPolicyStore {
  inner: SeasonalTierPolicyStore;
  cache: cache.TtlCache<SeasonalTierPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalTierPolicyStore,
    cacheValue: cache.TtlCache<SeasonalTierPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalTierPolicy | undefined {
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

  save(item: SeasonalTierPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalTierPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalTierPolicyStore(inner: SeasonalTierPolicyStore, ttl: number, clockValue: clock.Clock): SeasonalTierPolicyStore {
  return new CachedSeasonalTierPolicyStore(inner, cache.newTtlCache<SeasonalTierPolicy>(64, ttl, clockValue), 0, 0);
}

/** Selects seasonal tier policies. Empty fields match all. */
export class SeasonalTierPolicyQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalTierPolicy): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalTierPolicy[]): SeasonalTierPolicy[] {
    const matched = collections.filter(items, (candidate: SeasonalTierPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalTierPolicies(store: SeasonalTierPolicyStore, query: SeasonalTierPolicyQuery): SeasonalTierPolicy[] {
  return query.apply(store.list());
}
