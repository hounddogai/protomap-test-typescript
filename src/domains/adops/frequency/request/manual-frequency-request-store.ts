import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualFrequencyRequest } from "./manual-frequency-request.js";

/** Keeps manual frequency requests by code. */
export interface ManualFrequencyRequestStore {
  find(code: string): ManualFrequencyRequest | undefined;
  save(item: ManualFrequencyRequest): void;
  remove(code: string): boolean;
  list(): ManualFrequencyRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualFrequencyRequestStore implements ManualFrequencyRequestStore {
  items: Map<string, ManualFrequencyRequest>;
  order: string[];

  constructor(items: Map<string, ManualFrequencyRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualFrequencyRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualFrequencyRequest): void {
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

  list(): ManualFrequencyRequest[] {
    const out: ManualFrequencyRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualFrequencyRequestStore(): ManualFrequencyRequestStore {
  return new MemoryManualFrequencyRequestStore(new Map<string, ManualFrequencyRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualFrequencyRequestStore implements ManualFrequencyRequestStore {
  inner: ManualFrequencyRequestStore;
  cache: cache.TtlCache<ManualFrequencyRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualFrequencyRequestStore,
    cacheValue: cache.TtlCache<ManualFrequencyRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualFrequencyRequest | undefined {
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

  save(item: ManualFrequencyRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualFrequencyRequest[] {
    return this.inner.list();
  }
}

export function newCachedManualFrequencyRequestStore(inner: ManualFrequencyRequestStore, ttl: number, clockValue: clock.Clock): ManualFrequencyRequestStore {
  return new CachedManualFrequencyRequestStore(
    inner,
    cache.newTtlCache<ManualFrequencyRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual frequency requests. Empty fields match all. */
export class ManualFrequencyRequestQuery {
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

  matches(item: ManualFrequencyRequest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualFrequencyRequest[]): ManualFrequencyRequest[] {
    const matched = collections.filter(items, (candidate: ManualFrequencyRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualFrequencyRequests(store: ManualFrequencyRequestStore, query: ManualFrequencyRequestQuery): ManualFrequencyRequest[] {
  return query.apply(store.list());
}
