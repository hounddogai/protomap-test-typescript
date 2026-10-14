import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalStreakPolicy } from "./seasonal-streak-policy.js";

/** Keeps seasonal streak policies by code. */
export interface SeasonalStreakPolicyStore {
  find(code: string): SeasonalStreakPolicy | undefined;
  save(item: SeasonalStreakPolicy): void;
  remove(code: string): boolean;
  list(): SeasonalStreakPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalStreakPolicyStore implements SeasonalStreakPolicyStore {
  items: Map<string, SeasonalStreakPolicy>;
  order: string[];

  constructor(items: Map<string, SeasonalStreakPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalStreakPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalStreakPolicy): void {
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

  list(): SeasonalStreakPolicy[] {
    const out: SeasonalStreakPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalStreakPolicyStore(): SeasonalStreakPolicyStore {
  return new MemorySeasonalStreakPolicyStore(new Map<string, SeasonalStreakPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalStreakPolicyStore implements SeasonalStreakPolicyStore {
  inner: SeasonalStreakPolicyStore;
  cache: cache.TtlCache<SeasonalStreakPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalStreakPolicyStore,
    cacheValue: cache.TtlCache<SeasonalStreakPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalStreakPolicy | undefined {
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

  save(item: SeasonalStreakPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalStreakPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalStreakPolicyStore(inner: SeasonalStreakPolicyStore, ttl: number, clockValue: clock.Clock): SeasonalStreakPolicyStore {
  return new CachedSeasonalStreakPolicyStore(
    inner,
    cache.newTtlCache<SeasonalStreakPolicy>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal streak policies. Empty fields match all. */
export class SeasonalStreakPolicyQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalStreakPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalStreakPolicy[]): SeasonalStreakPolicy[] {
    const matched = collections.filter(items, (candidate: SeasonalStreakPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalStreakPolicies(store: SeasonalStreakPolicyStore, query: SeasonalStreakPolicyQuery): SeasonalStreakPolicy[] {
  return query.apply(store.list());
}
