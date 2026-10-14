import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingSummary } from "./pacing-summary.js";

/** Keeps pacing summaries by code. */
export interface PacingSummaryStore {
  find(code: string): PacingSummary | undefined;
  save(item: PacingSummary): void;
  remove(code: string): boolean;
  list(): PacingSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingSummaryStore implements PacingSummaryStore {
  items: Map<string, PacingSummary>;
  order: string[];

  constructor(items: Map<string, PacingSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingSummary): void {
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

  list(): PacingSummary[] {
    const out: PacingSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingSummaryStore(): PacingSummaryStore {
  return new MemoryPacingSummaryStore(new Map<string, PacingSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingSummaryStore implements PacingSummaryStore {
  inner: PacingSummaryStore;
  cache: cache.TtlCache<PacingSummary>;
  hits: number;
  misses: number;

  constructor(inner: PacingSummaryStore, cacheValue: cache.TtlCache<PacingSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingSummary | undefined {
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

  save(item: PacingSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingSummary[] {
    return this.inner.list();
  }
}

export function newCachedPacingSummaryStore(inner: PacingSummaryStore, ttl: number, clockValue: clock.Clock): PacingSummaryStore {
  return new CachedPacingSummaryStore(inner, cache.newTtlCache<PacingSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects pacing summaries. Empty fields match all. */
export class PacingSummaryQuery {
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

  matches(item: PacingSummary): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingSummary[]): PacingSummary[] {
    const matched = collections.filter(items, (candidate: PacingSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingSummaries(store: PacingSummaryStore, query: PacingSummaryQuery): PacingSummary[] {
  return query.apply(store.list());
}
