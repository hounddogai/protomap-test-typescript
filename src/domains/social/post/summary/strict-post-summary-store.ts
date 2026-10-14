import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPostSummary } from "./strict-post-summary.js";

/** Keeps strict post summaries by code. */
export interface StrictPostSummaryStore {
  find(code: string): StrictPostSummary | undefined;
  save(item: StrictPostSummary): void;
  remove(code: string): boolean;
  list(): StrictPostSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPostSummaryStore implements StrictPostSummaryStore {
  items: Map<string, StrictPostSummary>;
  order: string[];

  constructor(items: Map<string, StrictPostSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPostSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPostSummary): void {
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

  list(): StrictPostSummary[] {
    const out: StrictPostSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPostSummaryStore(): StrictPostSummaryStore {
  return new MemoryStrictPostSummaryStore(new Map<string, StrictPostSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPostSummaryStore implements StrictPostSummaryStore {
  inner: StrictPostSummaryStore;
  cache: cache.TtlCache<StrictPostSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPostSummaryStore,
    cacheValue: cache.TtlCache<StrictPostSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPostSummary | undefined {
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

  save(item: StrictPostSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPostSummary[] {
    return this.inner.list();
  }
}

export function newCachedStrictPostSummaryStore(inner: StrictPostSummaryStore, ttl: number, clockValue: clock.Clock): StrictPostSummaryStore {
  return new CachedStrictPostSummaryStore(inner, cache.newTtlCache<StrictPostSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict post summaries. Empty fields match all. */
export class StrictPostSummaryQuery {
  unit: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPostSummary): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPostSummary[]): StrictPostSummary[] {
    const matched = collections.filter(items, (candidate: StrictPostSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPostSummaries(store: StrictPostSummaryStore, query: StrictPostSummaryQuery): StrictPostSummary[] {
  return query.apply(store.list());
}
