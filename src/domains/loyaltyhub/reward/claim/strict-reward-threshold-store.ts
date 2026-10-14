import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRewardThreshold } from "./strict-reward-threshold.js";

/** Keeps strict reward thresholds by code. */
export interface StrictRewardThresholdStore {
  find(code: string): StrictRewardThreshold | undefined;
  save(item: StrictRewardThreshold): void;
  remove(code: string): boolean;
  list(): StrictRewardThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRewardThresholdStore implements StrictRewardThresholdStore {
  items: Map<string, StrictRewardThreshold>;
  order: string[];

  constructor(items: Map<string, StrictRewardThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRewardThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRewardThreshold): void {
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

  list(): StrictRewardThreshold[] {
    const out: StrictRewardThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRewardThresholdStore(): StrictRewardThresholdStore {
  return new MemoryStrictRewardThresholdStore(new Map<string, StrictRewardThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRewardThresholdStore implements StrictRewardThresholdStore {
  inner: StrictRewardThresholdStore;
  cache: cache.TtlCache<StrictRewardThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRewardThresholdStore,
    cacheValue: cache.TtlCache<StrictRewardThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRewardThreshold | undefined {
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

  save(item: StrictRewardThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRewardThreshold[] {
    return this.inner.list();
  }
}

export function newCachedStrictRewardThresholdStore(inner: StrictRewardThresholdStore, ttl: number, clockValue: clock.Clock): StrictRewardThresholdStore {
  return new CachedStrictRewardThresholdStore(
    inner,
    cache.newTtlCache<StrictRewardThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reward thresholds. Empty fields match all. */
export class StrictRewardThresholdQuery {
  unit: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minAmount: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRewardThreshold): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRewardThreshold[]): StrictRewardThreshold[] {
    const matched = collections.filter(items, (candidate: StrictRewardThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRewardThresholds(store: StrictRewardThresholdStore, query: StrictRewardThresholdQuery): StrictRewardThreshold[] {
  return query.apply(store.list());
}
