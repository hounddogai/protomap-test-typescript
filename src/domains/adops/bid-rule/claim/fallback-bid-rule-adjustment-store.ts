import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBidRuleAdjustment } from "./fallback-bid-rule-adjustment.js";

/** Keeps fallback bid rule adjustments by code. */
export interface FallbackBidRuleAdjustmentStore {
  find(code: string): FallbackBidRuleAdjustment | undefined;
  save(item: FallbackBidRuleAdjustment): void;
  remove(code: string): boolean;
  list(): FallbackBidRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBidRuleAdjustmentStore implements FallbackBidRuleAdjustmentStore {
  items: Map<string, FallbackBidRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, FallbackBidRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBidRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBidRuleAdjustment): void {
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

  list(): FallbackBidRuleAdjustment[] {
    const out: FallbackBidRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBidRuleAdjustmentStore(): FallbackBidRuleAdjustmentStore {
  return new MemoryFallbackBidRuleAdjustmentStore(new Map<string, FallbackBidRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBidRuleAdjustmentStore implements FallbackBidRuleAdjustmentStore {
  inner: FallbackBidRuleAdjustmentStore;
  cache: cache.TtlCache<FallbackBidRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBidRuleAdjustmentStore,
    cacheValue: cache.TtlCache<FallbackBidRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBidRuleAdjustment | undefined {
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

  save(item: FallbackBidRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBidRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBidRuleAdjustmentStore(inner: FallbackBidRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): FallbackBidRuleAdjustmentStore {
  return new CachedFallbackBidRuleAdjustmentStore(
    inner,
    cache.newTtlCache<FallbackBidRuleAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bid rule adjustments. Empty fields match all. */
export class FallbackBidRuleAdjustmentQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBidRuleAdjustment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBidRuleAdjustment[]): FallbackBidRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: FallbackBidRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBidRuleAdjustments(store: FallbackBidRuleAdjustmentStore, query: FallbackBidRuleAdjustmentQuery): FallbackBidRuleAdjustment[] {
  return query.apply(store.list());
}
