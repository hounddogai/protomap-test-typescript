import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

/** Keeps pending reward rule adjustments by code. */
export interface PendingRewardRuleAdjustmentStore {
  find(code: string): PendingRewardRuleAdjustment | undefined;
  save(item: PendingRewardRuleAdjustment): void;
  remove(code: string): boolean;
  list(): PendingRewardRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingRewardRuleAdjustmentStore implements PendingRewardRuleAdjustmentStore {
  items: Map<string, PendingRewardRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, PendingRewardRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingRewardRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingRewardRuleAdjustment): void {
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

  list(): PendingRewardRuleAdjustment[] {
    const out: PendingRewardRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingRewardRuleAdjustmentStore(): PendingRewardRuleAdjustmentStore {
  return new MemoryPendingRewardRuleAdjustmentStore(new Map<string, PendingRewardRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingRewardRuleAdjustmentStore implements PendingRewardRuleAdjustmentStore {
  inner: PendingRewardRuleAdjustmentStore;
  cache: cache.TtlCache<PendingRewardRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingRewardRuleAdjustmentStore,
    cacheValue: cache.TtlCache<PendingRewardRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingRewardRuleAdjustment | undefined {
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

  save(item: PendingRewardRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingRewardRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPendingRewardRuleAdjustmentStore(inner: PendingRewardRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): PendingRewardRuleAdjustmentStore {
  return new CachedPendingRewardRuleAdjustmentStore(
    inner,
    cache.newTtlCache<PendingRewardRuleAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reward rule adjustments. Empty fields match all. */
export class PendingRewardRuleAdjustmentQuery {
  source: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRatio: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingRewardRuleAdjustment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingRewardRuleAdjustment[]): PendingRewardRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: PendingRewardRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingRewardRuleAdjustments(store: PendingRewardRuleAdjustmentStore, query: PendingRewardRuleAdjustmentQuery): PendingRewardRuleAdjustment[] {
  return query.apply(store.list());
}
