import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

/** Keeps manual subscription baselines by code. */
export interface ManualSubscriptionBaselineStore {
  find(code: string): ManualSubscriptionBaseline | undefined;
  save(item: ManualSubscriptionBaseline): void;
  remove(code: string): boolean;
  list(): ManualSubscriptionBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualSubscriptionBaselineStore implements ManualSubscriptionBaselineStore {
  items: Map<string, ManualSubscriptionBaseline>;
  order: string[];

  constructor(items: Map<string, ManualSubscriptionBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualSubscriptionBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualSubscriptionBaseline): void {
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

  list(): ManualSubscriptionBaseline[] {
    const out: ManualSubscriptionBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualSubscriptionBaselineStore(): ManualSubscriptionBaselineStore {
  return new MemoryManualSubscriptionBaselineStore(new Map<string, ManualSubscriptionBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualSubscriptionBaselineStore implements ManualSubscriptionBaselineStore {
  inner: ManualSubscriptionBaselineStore;
  cache: cache.TtlCache<ManualSubscriptionBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualSubscriptionBaselineStore,
    cacheValue: cache.TtlCache<ManualSubscriptionBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualSubscriptionBaseline | undefined {
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

  save(item: ManualSubscriptionBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualSubscriptionBaseline[] {
    return this.inner.list();
  }
}

export function newCachedManualSubscriptionBaselineStore(inner: ManualSubscriptionBaselineStore, ttl: number, clockValue: clock.Clock): ManualSubscriptionBaselineStore {
  return new CachedManualSubscriptionBaselineStore(
    inner,
    cache.newTtlCache<ManualSubscriptionBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual subscription baselines. Empty fields match all. */
export class ManualSubscriptionBaselineQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualSubscriptionBaseline): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualSubscriptionBaseline[]): ManualSubscriptionBaseline[] {
    const matched = collections.filter(items, (candidate: ManualSubscriptionBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualSubscriptionBaselines(store: ManualSubscriptionBaselineStore, query: ManualSubscriptionBaselineQuery): ManualSubscriptionBaseline[] {
  return query.apply(store.list());
}
