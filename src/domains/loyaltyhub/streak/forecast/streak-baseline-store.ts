import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakBaseline } from "./streak-baseline.js";

/** Keeps streak baselines by code. */
export interface StreakBaselineStore {
  find(code: string): StreakBaseline | undefined;
  save(item: StreakBaseline): void;
  remove(code: string): boolean;
  list(): StreakBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakBaselineStore implements StreakBaselineStore {
  items: Map<string, StreakBaseline>;
  order: string[];

  constructor(items: Map<string, StreakBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakBaseline): void {
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

  list(): StreakBaseline[] {
    const out: StreakBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakBaselineStore(): StreakBaselineStore {
  return new MemoryStreakBaselineStore(new Map<string, StreakBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakBaselineStore implements StreakBaselineStore {
  inner: StreakBaselineStore;
  cache: cache.TtlCache<StreakBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakBaselineStore,
    cacheValue: cache.TtlCache<StreakBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakBaseline | undefined {
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

  save(item: StreakBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakBaseline[] {
    return this.inner.list();
  }
}

export function newCachedStreakBaselineStore(inner: StreakBaselineStore, ttl: number, clockValue: clock.Clock): StreakBaselineStore {
  return new CachedStreakBaselineStore(inner, cache.newTtlCache<StreakBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects streak baselines. Empty fields match all. */
export class StreakBaselineQuery {
  country: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBudget: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakBaseline): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakBaseline[]): StreakBaseline[] {
    const matched = collections.filter(items, (candidate: StreakBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakBaselines(store: StreakBaselineStore, query: StreakBaselineQuery): StreakBaseline[] {
  return query.apply(store.list());
}
