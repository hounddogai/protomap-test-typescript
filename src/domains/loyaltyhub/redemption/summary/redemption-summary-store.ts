import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionSummary } from "./redemption-summary.js";

/** Keeps redemption summaries by code. */
export interface RedemptionSummaryStore {
  find(code: string): RedemptionSummary | undefined;
  save(item: RedemptionSummary): void;
  remove(code: string): boolean;
  list(): RedemptionSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionSummaryStore implements RedemptionSummaryStore {
  items: Map<string, RedemptionSummary>;
  order: string[];

  constructor(items: Map<string, RedemptionSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionSummary): void {
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

  list(): RedemptionSummary[] {
    const out: RedemptionSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionSummaryStore(): RedemptionSummaryStore {
  return new MemoryRedemptionSummaryStore(new Map<string, RedemptionSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionSummaryStore implements RedemptionSummaryStore {
  inner: RedemptionSummaryStore;
  cache: cache.TtlCache<RedemptionSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionSummaryStore,
    cacheValue: cache.TtlCache<RedemptionSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionSummary | undefined {
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

  save(item: RedemptionSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionSummary[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionSummaryStore(inner: RedemptionSummaryStore, ttl: number, clockValue: clock.Clock): RedemptionSummaryStore {
  return new CachedRedemptionSummaryStore(inner, cache.newTtlCache<RedemptionSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects redemption summaries. Empty fields match all. */
export class RedemptionSummaryQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionSummary): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionSummary[]): RedemptionSummary[] {
    const matched = collections.filter(items, (candidate: RedemptionSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionSummaries(store: RedemptionSummaryStore, query: RedemptionSummaryQuery): RedemptionSummary[] {
  return query.apply(store.list());
}
