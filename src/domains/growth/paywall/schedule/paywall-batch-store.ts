import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallBatch } from "./paywall-batch.js";

/** Keeps paywall batches by code. */
export interface PaywallBatchStore {
  find(code: string): PaywallBatch | undefined;
  save(item: PaywallBatch): void;
  remove(code: string): boolean;
  list(): PaywallBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallBatchStore implements PaywallBatchStore {
  items: Map<string, PaywallBatch>;
  order: string[];

  constructor(items: Map<string, PaywallBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallBatch): void {
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

  list(): PaywallBatch[] {
    const out: PaywallBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallBatchStore(): PaywallBatchStore {
  return new MemoryPaywallBatchStore(new Map<string, PaywallBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallBatchStore implements PaywallBatchStore {
  inner: PaywallBatchStore;
  cache: cache.TtlCache<PaywallBatch>;
  hits: number;
  misses: number;

  constructor(inner: PaywallBatchStore, cacheValue: cache.TtlCache<PaywallBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallBatch | undefined {
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

  save(item: PaywallBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallBatch[] {
    return this.inner.list();
  }
}

export function newCachedPaywallBatchStore(inner: PaywallBatchStore, ttl: number, clockValue: clock.Clock): PaywallBatchStore {
  return new CachedPaywallBatchStore(inner, cache.newTtlCache<PaywallBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall batches. Empty fields match all. */
export class PaywallBatchQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallBatch): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallBatch[]): PaywallBatch[] {
    const matched = collections.filter(items, (candidate: PaywallBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallBatches(store: PaywallBatchStore, query: PaywallBatchQuery): PaywallBatch[] {
  return query.apply(store.list());
}
