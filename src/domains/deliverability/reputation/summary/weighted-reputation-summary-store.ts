import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReputationSummary } from "./weighted-reputation-summary.js";

/** Keeps weighted reputation summaries by code. */
export interface WeightedReputationSummaryStore {
  find(code: string): WeightedReputationSummary | undefined;
  save(item: WeightedReputationSummary): void;
  remove(code: string): boolean;
  list(): WeightedReputationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReputationSummaryStore implements WeightedReputationSummaryStore {
  items: Map<string, WeightedReputationSummary>;
  order: string[];

  constructor(items: Map<string, WeightedReputationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReputationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReputationSummary): void {
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

  list(): WeightedReputationSummary[] {
    const out: WeightedReputationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReputationSummaryStore(): WeightedReputationSummaryStore {
  return new MemoryWeightedReputationSummaryStore(new Map<string, WeightedReputationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReputationSummaryStore implements WeightedReputationSummaryStore {
  inner: WeightedReputationSummaryStore;
  cache: cache.TtlCache<WeightedReputationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReputationSummaryStore,
    cacheValue: cache.TtlCache<WeightedReputationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReputationSummary | undefined {
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

  save(item: WeightedReputationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReputationSummary[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReputationSummaryStore(inner: WeightedReputationSummaryStore, ttl: number, clockValue: clock.Clock): WeightedReputationSummaryStore {
  return new CachedWeightedReputationSummaryStore(
    inner,
    cache.newTtlCache<WeightedReputationSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reputation summaries. Empty fields match all. */
export class WeightedReputationSummaryQuery {
  utmSource: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minPriority: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReputationSummary): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReputationSummary[]): WeightedReputationSummary[] {
    const matched = collections.filter(items, (candidate: WeightedReputationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReputationSummaries(store: WeightedReputationSummaryStore, query: WeightedReputationSummaryQuery): WeightedReputationSummary[] {
  return query.apply(store.list());
}
