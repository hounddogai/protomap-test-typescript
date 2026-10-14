import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallAdjustment } from "./paywall-adjustment.js";

/** Keeps paywall adjustments by code. */
export interface PaywallAdjustmentStore {
  find(code: string): PaywallAdjustment | undefined;
  save(item: PaywallAdjustment): void;
  remove(code: string): boolean;
  list(): PaywallAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallAdjustmentStore implements PaywallAdjustmentStore {
  items: Map<string, PaywallAdjustment>;
  order: string[];

  constructor(items: Map<string, PaywallAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallAdjustment): void {
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

  list(): PaywallAdjustment[] {
    const out: PaywallAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallAdjustmentStore(): PaywallAdjustmentStore {
  return new MemoryPaywallAdjustmentStore(new Map<string, PaywallAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallAdjustmentStore implements PaywallAdjustmentStore {
  inner: PaywallAdjustmentStore;
  cache: cache.TtlCache<PaywallAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallAdjustmentStore,
    cacheValue: cache.TtlCache<PaywallAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallAdjustment | undefined {
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

  save(item: PaywallAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedPaywallAdjustmentStore(inner: PaywallAdjustmentStore, ttl: number, clockValue: clock.Clock): PaywallAdjustmentStore {
  return new CachedPaywallAdjustmentStore(inner, cache.newTtlCache<PaywallAdjustment>(64, ttl, clockValue), 0, 0);
}

/** Selects paywall adjustments. Empty fields match all. */
export class PaywallAdjustmentQuery {
  name: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallAdjustment[]): PaywallAdjustment[] {
    const matched = collections.filter(items, (candidate: PaywallAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallAdjustments(store: PaywallAdjustmentStore, query: PaywallAdjustmentQuery): PaywallAdjustment[] {
  return query.apply(store.list());
}
