import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightBaseline } from "./insight-baseline.js";

/** Keeps insight baselines by code. */
export interface InsightBaselineStore {
  find(code: string): InsightBaseline | undefined;
  save(item: InsightBaseline): void;
  remove(code: string): boolean;
  list(): InsightBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightBaselineStore implements InsightBaselineStore {
  items: Map<string, InsightBaseline>;
  order: string[];

  constructor(items: Map<string, InsightBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightBaseline): void {
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

  list(): InsightBaseline[] {
    const out: InsightBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightBaselineStore(): InsightBaselineStore {
  return new MemoryInsightBaselineStore(new Map<string, InsightBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightBaselineStore implements InsightBaselineStore {
  inner: InsightBaselineStore;
  cache: cache.TtlCache<InsightBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightBaselineStore,
    cacheValue: cache.TtlCache<InsightBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightBaseline | undefined {
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

  save(item: InsightBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightBaseline[] {
    return this.inner.list();
  }
}

export function newCachedInsightBaselineStore(inner: InsightBaselineStore, ttl: number, clockValue: clock.Clock): InsightBaselineStore {
  return new CachedInsightBaselineStore(inner, cache.newTtlCache<InsightBaseline>(64, ttl, clockValue), 0, 0);
}

/** Selects insight baselines. Empty fields match all. */
export class InsightBaselineQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightBaseline): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightBaseline[]): InsightBaseline[] {
    const matched = collections.filter(items, (candidate: InsightBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightBaselines(store: InsightBaselineStore, query: InsightBaselineQuery): InsightBaseline[] {
  return query.apply(store.list());
}
