import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

/** Keeps tiered reward rule adjustments by code. */
export interface TieredRewardRuleAdjustmentStore {
  find(code: string): TieredRewardRuleAdjustment | undefined;
  save(item: TieredRewardRuleAdjustment): void;
  remove(code: string): boolean;
  list(): TieredRewardRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRewardRuleAdjustmentStore implements TieredRewardRuleAdjustmentStore {
  items: Map<string, TieredRewardRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, TieredRewardRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRewardRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRewardRuleAdjustment): void {
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

  list(): TieredRewardRuleAdjustment[] {
    const out: TieredRewardRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRewardRuleAdjustmentStore(): TieredRewardRuleAdjustmentStore {
  return new MemoryTieredRewardRuleAdjustmentStore(new Map<string, TieredRewardRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRewardRuleAdjustmentStore implements TieredRewardRuleAdjustmentStore {
  inner: TieredRewardRuleAdjustmentStore;
  cache: cache.TtlCache<TieredRewardRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRewardRuleAdjustmentStore,
    cacheValue: cache.TtlCache<TieredRewardRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRewardRuleAdjustment | undefined {
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

  save(item: TieredRewardRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRewardRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedTieredRewardRuleAdjustmentStore(inner: TieredRewardRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): TieredRewardRuleAdjustmentStore {
  return new CachedTieredRewardRuleAdjustmentStore(
    inner,
    cache.newTtlCache<TieredRewardRuleAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered reward rule adjustments. Empty fields match all. */
export class TieredRewardRuleAdjustmentQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRewardRuleAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRewardRuleAdjustment[]): TieredRewardRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: TieredRewardRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRewardRuleAdjustments(store: TieredRewardRuleAdjustmentStore, query: TieredRewardRuleAdjustmentQuery): TieredRewardRuleAdjustment[] {
  return query.apply(store.list());
}
