import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckSummary } from "./fraud-check-summary.js";

/** Keeps fraud check summaries by code. */
export interface FraudCheckSummaryStore {
  find(code: string): FraudCheckSummary | undefined;
  save(item: FraudCheckSummary): void;
  remove(code: string): boolean;
  list(): FraudCheckSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckSummaryStore implements FraudCheckSummaryStore {
  items: Map<string, FraudCheckSummary>;
  order: string[];

  constructor(items: Map<string, FraudCheckSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckSummary): void {
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

  list(): FraudCheckSummary[] {
    const out: FraudCheckSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckSummaryStore(): FraudCheckSummaryStore {
  return new MemoryFraudCheckSummaryStore(new Map<string, FraudCheckSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckSummaryStore implements FraudCheckSummaryStore {
  inner: FraudCheckSummaryStore;
  cache: cache.TtlCache<FraudCheckSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckSummaryStore,
    cacheValue: cache.TtlCache<FraudCheckSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckSummary | undefined {
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

  save(item: FraudCheckSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckSummary[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckSummaryStore(inner: FraudCheckSummaryStore, ttl: number, clockValue: clock.Clock): FraudCheckSummaryStore {
  return new CachedFraudCheckSummaryStore(inner, cache.newTtlCache<FraudCheckSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects fraud check summaries. Empty fields match all. */
export class FraudCheckSummaryQuery {
  unit: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minSendAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckSummary): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckSummary[]): FraudCheckSummary[] {
    const matched = collections.filter(items, (candidate: FraudCheckSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckSummaries(store: FraudCheckSummaryStore, query: FraudCheckSummaryQuery): FraudCheckSummary[] {
  return query.apply(store.list());
}
