import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallEstimate } from "./paywall-estimate.js";

/** Keeps paywall estimates by code. */
export interface PaywallEstimateStore {
  find(code: string): PaywallEstimate | undefined;
  save(item: PaywallEstimate): void;
  remove(code: string): boolean;
  list(): PaywallEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallEstimateStore implements PaywallEstimateStore {
  items: Map<string, PaywallEstimate>;
  order: string[];

  constructor(items: Map<string, PaywallEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallEstimate): void {
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

  list(): PaywallEstimate[] {
    const out: PaywallEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallEstimateStore(): PaywallEstimateStore {
  return new MemoryPaywallEstimateStore(new Map<string, PaywallEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallEstimateStore implements PaywallEstimateStore {
  inner: PaywallEstimateStore;
  cache: cache.TtlCache<PaywallEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallEstimateStore,
    cacheValue: cache.TtlCache<PaywallEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallEstimate | undefined {
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

  save(item: PaywallEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPaywallEstimateStore(inner: PaywallEstimateStore, ttl: number, clockValue: clock.Clock): PaywallEstimateStore {
  return new CachedPaywallEstimateStore(inner, cache.newTtlCache<PaywallEstimate>(256, ttl, clockValue), 0, 0);
}

/** Selects paywall estimates. Empty fields match all. */
export class PaywallEstimateQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallEstimate[]): PaywallEstimate[] {
    const matched = collections.filter(items, (candidate: PaywallEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallEstimates(store: PaywallEstimateStore, query: PaywallEstimateQuery): PaywallEstimate[] {
  return query.apply(store.list());
}
