import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictInsightRollup } from "./strict-insight-rollup.js";

/** Keeps strict insight rollups by code. */
export interface StrictInsightRollupStore {
  find(code: string): StrictInsightRollup | undefined;
  save(item: StrictInsightRollup): void;
  remove(code: string): boolean;
  list(): StrictInsightRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictInsightRollupStore implements StrictInsightRollupStore {
  items: Map<string, StrictInsightRollup>;
  order: string[];

  constructor(items: Map<string, StrictInsightRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictInsightRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictInsightRollup): void {
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

  list(): StrictInsightRollup[] {
    const out: StrictInsightRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictInsightRollupStore(): StrictInsightRollupStore {
  return new MemoryStrictInsightRollupStore(new Map<string, StrictInsightRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictInsightRollupStore implements StrictInsightRollupStore {
  inner: StrictInsightRollupStore;
  cache: cache.TtlCache<StrictInsightRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictInsightRollupStore,
    cacheValue: cache.TtlCache<StrictInsightRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictInsightRollup | undefined {
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

  save(item: StrictInsightRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictInsightRollup[] {
    return this.inner.list();
  }
}

export function newCachedStrictInsightRollupStore(inner: StrictInsightRollupStore, ttl: number, clockValue: clock.Clock): StrictInsightRollupStore {
  return new CachedStrictInsightRollupStore(inner, cache.newTtlCache<StrictInsightRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects strict insight rollups. Empty fields match all. */
export class StrictInsightRollupQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictInsightRollup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictInsightRollup[]): StrictInsightRollup[] {
    const matched = collections.filter(items, (candidate: StrictInsightRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictInsightRollups(store: StrictInsightRollupStore, query: StrictInsightRollupQuery): StrictInsightRollup[] {
  return query.apply(store.list());
}
