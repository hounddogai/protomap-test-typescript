import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencySummary } from "./frequency-summary.js";

/** Keeps frequency summaries by code. */
export interface FrequencySummaryStore {
  find(code: string): FrequencySummary | undefined;
  save(item: FrequencySummary): void;
  remove(code: string): boolean;
  list(): FrequencySummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencySummaryStore implements FrequencySummaryStore {
  items: Map<string, FrequencySummary>;
  order: string[];

  constructor(items: Map<string, FrequencySummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencySummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencySummary): void {
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

  list(): FrequencySummary[] {
    const out: FrequencySummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencySummaryStore(): FrequencySummaryStore {
  return new MemoryFrequencySummaryStore(new Map<string, FrequencySummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencySummaryStore implements FrequencySummaryStore {
  inner: FrequencySummaryStore;
  cache: cache.TtlCache<FrequencySummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencySummaryStore,
    cacheValue: cache.TtlCache<FrequencySummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencySummary | undefined {
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

  save(item: FrequencySummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencySummary[] {
    return this.inner.list();
  }
}

export function newCachedFrequencySummaryStore(inner: FrequencySummaryStore, ttl: number, clockValue: clock.Clock): FrequencySummaryStore {
  return new CachedFrequencySummaryStore(inner, cache.newTtlCache<FrequencySummary>(256, ttl, clockValue), 0, 0);
}

/** Selects frequency summaries. Empty fields match all. */
export class FrequencySummaryQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencySummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencySummary[]): FrequencySummary[] {
    const matched = collections.filter(items, (candidate: FrequencySummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencySummaries(store: FrequencySummaryStore, query: FrequencySummaryQuery): FrequencySummary[] {
  return query.apply(store.list());
}
