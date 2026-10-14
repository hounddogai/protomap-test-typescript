import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalVariance } from "./approval-variance.js";

/** Keeps approval variances by code. */
export interface ApprovalVarianceStore {
  find(code: string): ApprovalVariance | undefined;
  save(item: ApprovalVariance): void;
  remove(code: string): boolean;
  list(): ApprovalVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalVarianceStore implements ApprovalVarianceStore {
  items: Map<string, ApprovalVariance>;
  order: string[];

  constructor(items: Map<string, ApprovalVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalVariance): void {
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

  list(): ApprovalVariance[] {
    const out: ApprovalVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalVarianceStore(): ApprovalVarianceStore {
  return new MemoryApprovalVarianceStore(new Map<string, ApprovalVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalVarianceStore implements ApprovalVarianceStore {
  inner: ApprovalVarianceStore;
  cache: cache.TtlCache<ApprovalVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalVarianceStore,
    cacheValue: cache.TtlCache<ApprovalVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalVariance | undefined {
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

  save(item: ApprovalVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalVariance[] {
    return this.inner.list();
  }
}

export function newCachedApprovalVarianceStore(inner: ApprovalVarianceStore, ttl: number, clockValue: clock.Clock): ApprovalVarianceStore {
  return new CachedApprovalVarianceStore(inner, cache.newTtlCache<ApprovalVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects approval variances. Empty fields match all. */
export class ApprovalVarianceQuery {
  utmSource: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMinimum: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalVariance): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalVariance[]): ApprovalVariance[] {
    const matched = collections.filter(items, (candidate: ApprovalVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalVariances(store: ApprovalVarianceStore, query: ApprovalVarianceQuery): ApprovalVariance[] {
  return query.apply(store.list());
}
