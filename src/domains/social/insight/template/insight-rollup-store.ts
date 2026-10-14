import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightRollup } from "./insight-rollup.js";

/** Keeps insight rollups by code. */
export interface InsightRollupStore {
  find(code: string): InsightRollup | undefined;
  save(item: InsightRollup): void;
  remove(code: string): boolean;
  list(): InsightRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightRollupStore implements InsightRollupStore {
  items: Map<string, InsightRollup>;
  order: string[];

  constructor(items: Map<string, InsightRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightRollup): void {
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

  list(): InsightRollup[] {
    const out: InsightRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightRollupStore(): InsightRollupStore {
  return new MemoryInsightRollupStore(new Map<string, InsightRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightRollupStore implements InsightRollupStore {
  inner: InsightRollupStore;
  cache: cache.TtlCache<InsightRollup>;
  hits: number;
  misses: number;

  constructor(inner: InsightRollupStore, cacheValue: cache.TtlCache<InsightRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightRollup | undefined {
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

  save(item: InsightRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightRollup[] {
    return this.inner.list();
  }
}

export function newCachedInsightRollupStore(inner: InsightRollupStore, ttl: number, clockValue: clock.Clock): InsightRollupStore {
  return new CachedInsightRollupStore(inner, cache.newTtlCache<InsightRollup>(128, ttl, clockValue), 0, 0);
}

/** Selects insight rollups. Empty fields match all. */
export class InsightRollupQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightRollup[]): InsightRollup[] {
    const matched = collections.filter(items, (candidate: InsightRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightRollups(store: InsightRollupStore, query: InsightRollupQuery): InsightRollup[] {
  return query.apply(store.list());
}
