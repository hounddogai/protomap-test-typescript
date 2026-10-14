import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalMetric } from "./approval-metric.js";

/** Keeps approval metrics by code. */
export interface ApprovalMetricStore {
  find(code: string): ApprovalMetric | undefined;
  save(item: ApprovalMetric): void;
  remove(code: string): boolean;
  list(): ApprovalMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalMetricStore implements ApprovalMetricStore {
  items: Map<string, ApprovalMetric>;
  order: string[];

  constructor(items: Map<string, ApprovalMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalMetric): void {
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

  list(): ApprovalMetric[] {
    const out: ApprovalMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalMetricStore(): ApprovalMetricStore {
  return new MemoryApprovalMetricStore(new Map<string, ApprovalMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalMetricStore implements ApprovalMetricStore {
  inner: ApprovalMetricStore;
  cache: cache.TtlCache<ApprovalMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalMetricStore,
    cacheValue: cache.TtlCache<ApprovalMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalMetric | undefined {
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

  save(item: ApprovalMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalMetric[] {
    return this.inner.list();
  }
}

export function newCachedApprovalMetricStore(inner: ApprovalMetricStore, ttl: number, clockValue: clock.Clock): ApprovalMetricStore {
  return new CachedApprovalMetricStore(inner, cache.newTtlCache<ApprovalMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects approval metrics. Empty fields match all. */
export class ApprovalMetricQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalMetric[]): ApprovalMetric[] {
    const matched = collections.filter(items, (candidate: ApprovalMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalMetrics(store: ApprovalMetricStore, query: ApprovalMetricQuery): ApprovalMetric[] {
  return query.apply(store.list());
}
