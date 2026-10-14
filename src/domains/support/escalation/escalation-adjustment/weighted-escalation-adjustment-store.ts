import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

/** Keeps weighted escalation adjustments by code. */
export interface WeightedEscalationAdjustmentStore {
  find(code: string): WeightedEscalationAdjustment | undefined;
  save(item: WeightedEscalationAdjustment): void;
  remove(code: string): boolean;
  list(): WeightedEscalationAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedEscalationAdjustmentStore implements WeightedEscalationAdjustmentStore {
  items: Map<string, WeightedEscalationAdjustment>;
  order: string[];

  constructor(items: Map<string, WeightedEscalationAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedEscalationAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedEscalationAdjustment): void {
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

  list(): WeightedEscalationAdjustment[] {
    const out: WeightedEscalationAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedEscalationAdjustmentStore(): WeightedEscalationAdjustmentStore {
  return new MemoryWeightedEscalationAdjustmentStore(new Map<string, WeightedEscalationAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedEscalationAdjustmentStore implements WeightedEscalationAdjustmentStore {
  inner: WeightedEscalationAdjustmentStore;
  cache: cache.TtlCache<WeightedEscalationAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedEscalationAdjustmentStore,
    cacheValue: cache.TtlCache<WeightedEscalationAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedEscalationAdjustment | undefined {
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

  save(item: WeightedEscalationAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedEscalationAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedWeightedEscalationAdjustmentStore(inner: WeightedEscalationAdjustmentStore, ttl: number, clockValue: clock.Clock): WeightedEscalationAdjustmentStore {
  return new CachedWeightedEscalationAdjustmentStore(
    inner,
    cache.newTtlCache<WeightedEscalationAdjustment>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted escalation adjustments. Empty fields match all. */
export class WeightedEscalationAdjustmentQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedEscalationAdjustment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedEscalationAdjustment[]): WeightedEscalationAdjustment[] {
    const matched = collections.filter(items, (candidate: WeightedEscalationAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedEscalationAdjustments(store: WeightedEscalationAdjustmentStore, query: WeightedEscalationAdjustmentQuery): WeightedEscalationAdjustment[] {
  return query.apply(store.list());
}
