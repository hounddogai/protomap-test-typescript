import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCreditEstimate } from "./pending-credit-estimate.js";

/** Keeps pending credit estimates by code. */
export interface PendingCreditEstimateStore {
  find(code: string): PendingCreditEstimate | undefined;
  save(item: PendingCreditEstimate): void;
  remove(code: string): boolean;
  list(): PendingCreditEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCreditEstimateStore implements PendingCreditEstimateStore {
  items: Map<string, PendingCreditEstimate>;
  order: string[];

  constructor(items: Map<string, PendingCreditEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCreditEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCreditEstimate): void {
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

  list(): PendingCreditEstimate[] {
    const out: PendingCreditEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCreditEstimateStore(): PendingCreditEstimateStore {
  return new MemoryPendingCreditEstimateStore(new Map<string, PendingCreditEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCreditEstimateStore implements PendingCreditEstimateStore {
  inner: PendingCreditEstimateStore;
  cache: cache.TtlCache<PendingCreditEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCreditEstimateStore,
    cacheValue: cache.TtlCache<PendingCreditEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCreditEstimate | undefined {
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

  save(item: PendingCreditEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCreditEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPendingCreditEstimateStore(inner: PendingCreditEstimateStore, ttl: number, clockValue: clock.Clock): PendingCreditEstimateStore {
  return new CachedPendingCreditEstimateStore(
    inner,
    cache.newTtlCache<PendingCreditEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending credit estimates. Empty fields match all. */
export class PendingCreditEstimateQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCreditEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCreditEstimate[]): PendingCreditEstimate[] {
    const matched = collections.filter(items, (candidate: PendingCreditEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCreditEstimates(store: PendingCreditEstimateStore, query: PendingCreditEstimateQuery): PendingCreditEstimate[] {
  return query.apply(store.list());
}
