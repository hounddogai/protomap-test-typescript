import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

/** Keeps manual reward rule adjustments by code. */
export interface ManualRewardRuleAdjustmentStore {
  find(code: string): ManualRewardRuleAdjustment | undefined;
  save(item: ManualRewardRuleAdjustment): void;
  remove(code: string): boolean;
  list(): ManualRewardRuleAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRewardRuleAdjustmentStore implements ManualRewardRuleAdjustmentStore {
  items: Map<string, ManualRewardRuleAdjustment>;
  order: string[];

  constructor(items: Map<string, ManualRewardRuleAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRewardRuleAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRewardRuleAdjustment): void {
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

  list(): ManualRewardRuleAdjustment[] {
    const out: ManualRewardRuleAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRewardRuleAdjustmentStore(): ManualRewardRuleAdjustmentStore {
  return new MemoryManualRewardRuleAdjustmentStore(new Map<string, ManualRewardRuleAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRewardRuleAdjustmentStore implements ManualRewardRuleAdjustmentStore {
  inner: ManualRewardRuleAdjustmentStore;
  cache: cache.TtlCache<ManualRewardRuleAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRewardRuleAdjustmentStore,
    cacheValue: cache.TtlCache<ManualRewardRuleAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRewardRuleAdjustment | undefined {
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

  save(item: ManualRewardRuleAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRewardRuleAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedManualRewardRuleAdjustmentStore(inner: ManualRewardRuleAdjustmentStore, ttl: number, clockValue: clock.Clock): ManualRewardRuleAdjustmentStore {
  return new CachedManualRewardRuleAdjustmentStore(
    inner,
    cache.newTtlCache<ManualRewardRuleAdjustment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual reward rule adjustments. Empty fields match all. */
export class ManualRewardRuleAdjustmentQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRewardRuleAdjustment): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRewardRuleAdjustment[]): ManualRewardRuleAdjustment[] {
    const matched = collections.filter(items, (candidate: ManualRewardRuleAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRewardRuleAdjustments(store: ManualRewardRuleAdjustmentStore, query: ManualRewardRuleAdjustmentQuery): ManualRewardRuleAdjustment[] {
  return query.apply(store.list());
}
