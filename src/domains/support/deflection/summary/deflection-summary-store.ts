import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionSummary } from "./deflection-summary.js";

/** Keeps deflection summaries by code. */
export interface DeflectionSummaryStore {
  find(code: string): DeflectionSummary | undefined;
  save(item: DeflectionSummary): void;
  remove(code: string): boolean;
  list(): DeflectionSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionSummaryStore implements DeflectionSummaryStore {
  items: Map<string, DeflectionSummary>;
  order: string[];

  constructor(items: Map<string, DeflectionSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionSummary): void {
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

  list(): DeflectionSummary[] {
    const out: DeflectionSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionSummaryStore(): DeflectionSummaryStore {
  return new MemoryDeflectionSummaryStore(new Map<string, DeflectionSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionSummaryStore implements DeflectionSummaryStore {
  inner: DeflectionSummaryStore;
  cache: cache.TtlCache<DeflectionSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionSummaryStore,
    cacheValue: cache.TtlCache<DeflectionSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionSummary | undefined {
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

  save(item: DeflectionSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionSummary[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionSummaryStore(inner: DeflectionSummaryStore, ttl: number, clockValue: clock.Clock): DeflectionSummaryStore {
  return new CachedDeflectionSummaryStore(inner, cache.newTtlCache<DeflectionSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection summaries. Empty fields match all. */
export class DeflectionSummaryQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionSummary[]): DeflectionSummary[] {
    const matched = collections.filter(items, (candidate: DeflectionSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionSummaries(store: DeflectionSummaryStore, query: DeflectionSummaryQuery): DeflectionSummary[] {
  return query.apply(store.list());
}
