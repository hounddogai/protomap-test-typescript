import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceSummary } from "./bounce-summary.js";

/** Keeps bounce summaries by code. */
export interface BounceSummaryStore {
  find(code: string): BounceSummary | undefined;
  save(item: BounceSummary): void;
  remove(code: string): boolean;
  list(): BounceSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceSummaryStore implements BounceSummaryStore {
  items: Map<string, BounceSummary>;
  order: string[];

  constructor(items: Map<string, BounceSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceSummary): void {
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

  list(): BounceSummary[] {
    const out: BounceSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceSummaryStore(): BounceSummaryStore {
  return new MemoryBounceSummaryStore(new Map<string, BounceSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceSummaryStore implements BounceSummaryStore {
  inner: BounceSummaryStore;
  cache: cache.TtlCache<BounceSummary>;
  hits: number;
  misses: number;

  constructor(inner: BounceSummaryStore, cacheValue: cache.TtlCache<BounceSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceSummary | undefined {
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

  save(item: BounceSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceSummary[] {
    return this.inner.list();
  }
}

export function newCachedBounceSummaryStore(inner: BounceSummaryStore, ttl: number, clockValue: clock.Clock): BounceSummaryStore {
  return new CachedBounceSummaryStore(inner, cache.newTtlCache<BounceSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects bounce summaries. Empty fields match all. */
export class BounceSummaryQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceSummary): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceSummary[]): BounceSummary[] {
    const matched = collections.filter(items, (candidate: BounceSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceSummaries(store: BounceSummaryStore, query: BounceSummaryQuery): BounceSummary[] {
  return query.apply(store.list());
}
