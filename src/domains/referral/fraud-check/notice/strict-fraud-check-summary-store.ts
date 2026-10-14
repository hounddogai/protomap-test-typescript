import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictFraudCheckSummary } from "./strict-fraud-check-summary.js";

/** Keeps strict fraud check summaries by code. */
export interface StrictFraudCheckSummaryStore {
  find(code: string): StrictFraudCheckSummary | undefined;
  save(item: StrictFraudCheckSummary): void;
  remove(code: string): boolean;
  list(): StrictFraudCheckSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictFraudCheckSummaryStore implements StrictFraudCheckSummaryStore {
  items: Map<string, StrictFraudCheckSummary>;
  order: string[];

  constructor(items: Map<string, StrictFraudCheckSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictFraudCheckSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictFraudCheckSummary): void {
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

  list(): StrictFraudCheckSummary[] {
    const out: StrictFraudCheckSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictFraudCheckSummaryStore(): StrictFraudCheckSummaryStore {
  return new MemoryStrictFraudCheckSummaryStore(new Map<string, StrictFraudCheckSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictFraudCheckSummaryStore implements StrictFraudCheckSummaryStore {
  inner: StrictFraudCheckSummaryStore;
  cache: cache.TtlCache<StrictFraudCheckSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictFraudCheckSummaryStore,
    cacheValue: cache.TtlCache<StrictFraudCheckSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictFraudCheckSummary | undefined {
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

  save(item: StrictFraudCheckSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictFraudCheckSummary[] {
    return this.inner.list();
  }
}

export function newCachedStrictFraudCheckSummaryStore(inner: StrictFraudCheckSummaryStore, ttl: number, clockValue: clock.Clock): StrictFraudCheckSummaryStore {
  return new CachedStrictFraudCheckSummaryStore(
    inner,
    cache.newTtlCache<StrictFraudCheckSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict fraud check summaries. Empty fields match all. */
export class StrictFraudCheckSummaryQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictFraudCheckSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictFraudCheckSummary[]): StrictFraudCheckSummary[] {
    const matched = collections.filter(items, (candidate: StrictFraudCheckSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictFraudCheckSummaries(store: StrictFraudCheckSummaryStore, query: StrictFraudCheckSummaryQuery): StrictFraudCheckSummary[] {
  return query.apply(store.list());
}
