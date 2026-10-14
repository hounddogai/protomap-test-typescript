import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

/** Keeps lenient bid rule adjustments by code. */
export interface LenientBidRuleAdjustmentStore {
  find(code: string): LenientBidRuleAdjustment | undefined;
  save(item: LenientBidRuleAdjustment): void;
  remove(code: string): boolean;
  list(): LenientBidRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBidRuleAdjustmentStore implements LenientBidRuleAdjustmentStore {
  items: Map<string, LenientBidRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, LenientBidRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBidRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBidRuleAdjustment): void {
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

  list(): LenientBidRuleAdjustment[] {
    const out: LenientBidRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBidRuleAdjustmentStore(): LenientBidRuleAdjustmentStore {
  return new MemoryLenientBidRuleAdjustmentStore(new Map<string, LenientBidRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBidRuleAdjustmentStore implements LenientBidRuleAdjustmentStore {
  inner: LenientBidRuleAdjustmentStore;
  cache: cache.TtlCache<LenientBidRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBidRuleAdjustmentStore,
    cacheValue: cache.TtlCache<LenientBidRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBidRuleAdjustment | undefined {
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

  save(item: LenientBidRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBidRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedLenientBidRuleAdjustmentStore(inner: LenientBidRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): LenientBidRuleAdjustmentStore {
  return new CachedLenientBidRuleAdjustmentStore(
    inner,
    cache.newTtlCache<LenientBidRuleAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient bid rule adjustments. Empty fields match all. */
export class LenientBidRuleAdjustmentQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBidRuleAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBidRuleAdjustment[]): LenientBidRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: LenientBidRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBidRuleAdjustments(store: LenientBidRuleAdjustmentStore, query: LenientBidRuleAdjustmentQuery): LenientBidRuleAdjustment[] {
  return query.apply(store.list());
}
