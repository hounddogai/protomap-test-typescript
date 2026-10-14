import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedStreakSummary } from "./weighted-streak-summary.js";

/** Keeps weighted streak summaries by code. */
export interface WeightedStreakSummaryStore {
  find(code: string): WeightedStreakSummary | undefined;
  save(item: WeightedStreakSummary): void;
  remove(code: string): boolean;
  list(): WeightedStreakSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedStreakSummaryStore implements WeightedStreakSummaryStore {
  items: Map<string, WeightedStreakSummary>;
  order: string[];

  constructor(items: Map<string, WeightedStreakSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedStreakSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedStreakSummary): void {
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

  list(): WeightedStreakSummary[] {
    const out: WeightedStreakSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedStreakSummaryStore(): WeightedStreakSummaryStore {
  return new MemoryWeightedStreakSummaryStore(new Map<string, WeightedStreakSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedStreakSummaryStore implements WeightedStreakSummaryStore {
  inner: WeightedStreakSummaryStore;
  cache: cache.TtlCache<WeightedStreakSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedStreakSummaryStore,
    cacheValue: cache.TtlCache<WeightedStreakSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedStreakSummary | undefined {
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

  save(item: WeightedStreakSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedStreakSummary[] {
    return this.inner.list();
  }
}

export function newCachedWeightedStreakSummaryStore(inner: WeightedStreakSummaryStore, ttl: number, clockValue: clock.Clock): WeightedStreakSummaryStore {
  return new CachedWeightedStreakSummaryStore(
    inner,
    cache.newTtlCache<WeightedStreakSummary>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted streak summaries. Empty fields match all. */
export class WeightedStreakSummaryQuery {
  title: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minPriority: number, statuses: string[], limit: number) {
    this.title = title;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedStreakSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedStreakSummary[]): WeightedStreakSummary[] {
    const matched = collections.filter(items, (candidate: WeightedStreakSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedStreakSummaries(store: WeightedStreakSummaryStore, query: WeightedStreakSummaryQuery): WeightedStreakSummary[] {
  return query.apply(store.list());
}
