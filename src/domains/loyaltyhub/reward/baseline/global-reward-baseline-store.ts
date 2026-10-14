import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRewardBaseline } from "./global-reward-baseline.js";

/** Keeps global reward baselines by code. */
export interface GlobalRewardBaselineStore {
  find(code: string): GlobalRewardBaseline | undefined;
  save(item: GlobalRewardBaseline): void;
  remove(code: string): boolean;
  list(): GlobalRewardBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRewardBaselineStore implements GlobalRewardBaselineStore {
  items: Map<string, GlobalRewardBaseline>;
  order: string[];

  constructor(items: Map<string, GlobalRewardBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRewardBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRewardBaseline): void {
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

  list(): GlobalRewardBaseline[] {
    const out: GlobalRewardBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRewardBaselineStore(): GlobalRewardBaselineStore {
  return new MemoryGlobalRewardBaselineStore(new Map<string, GlobalRewardBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRewardBaselineStore implements GlobalRewardBaselineStore {
  inner: GlobalRewardBaselineStore;
  cache: cache.TtlCache<GlobalRewardBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRewardBaselineStore,
    cacheValue: cache.TtlCache<GlobalRewardBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRewardBaseline | undefined {
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

  save(item: GlobalRewardBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRewardBaseline[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRewardBaselineStore(inner: GlobalRewardBaselineStore, ttl: number, clockValue: clock.Clock): GlobalRewardBaselineStore {
  return new CachedGlobalRewardBaselineStore(
    inner,
    cache.newTtlCache<GlobalRewardBaseline>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global reward baselines. Empty fields match all. */
export class GlobalRewardBaselineQuery {
  source: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAmount: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRewardBaseline): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRewardBaseline[]): GlobalRewardBaseline[] {
    const matched = collections.filter(items, (candidate: GlobalRewardBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRewardBaselines(store: GlobalRewardBaselineStore, query: GlobalRewardBaselineQuery): GlobalRewardBaseline[] {
  return query.apply(store.list());
}
