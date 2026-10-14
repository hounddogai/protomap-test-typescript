import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalEstimate } from "./approval-estimate.js";

/** Keeps approval estimates by code. */
export interface ApprovalEstimateStore {
  find(code: string): ApprovalEstimate | undefined;
  save(item: ApprovalEstimate): void;
  remove(code: string): boolean;
  list(): ApprovalEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalEstimateStore implements ApprovalEstimateStore {
  items: Map<string, ApprovalEstimate>;
  order: string[];

  constructor(items: Map<string, ApprovalEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalEstimate): void {
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

  list(): ApprovalEstimate[] {
    const out: ApprovalEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalEstimateStore(): ApprovalEstimateStore {
  return new MemoryApprovalEstimateStore(new Map<string, ApprovalEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalEstimateStore implements ApprovalEstimateStore {
  inner: ApprovalEstimateStore;
  cache: cache.TtlCache<ApprovalEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalEstimateStore,
    cacheValue: cache.TtlCache<ApprovalEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalEstimate | undefined {
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

  save(item: ApprovalEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalEstimate[] {
    return this.inner.list();
  }
}

export function newCachedApprovalEstimateStore(inner: ApprovalEstimateStore, ttl: number, clockValue: clock.Clock): ApprovalEstimateStore {
  return new CachedApprovalEstimateStore(inner, cache.newTtlCache<ApprovalEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects approval estimates. Empty fields match all. */
export class ApprovalEstimateQuery {
  segment: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCeiling: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalEstimate[]): ApprovalEstimate[] {
    const matched = collections.filter(items, (candidate: ApprovalEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalEstimates(store: ApprovalEstimateStore, query: ApprovalEstimateQuery): ApprovalEstimate[] {
  return query.apply(store.list());
}
