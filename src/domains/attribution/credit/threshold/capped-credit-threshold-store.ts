import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCreditThreshold } from "./capped-credit-threshold.js";

/** Keeps capped credit thresholds by code. */
export interface CappedCreditThresholdStore {
  find(code: string): CappedCreditThreshold | undefined;
  save(item: CappedCreditThreshold): void;
  remove(code: string): boolean;
  list(): CappedCreditThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCreditThresholdStore implements CappedCreditThresholdStore {
  items: Map<string, CappedCreditThreshold>;
  order: string[];

  constructor(items: Map<string, CappedCreditThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCreditThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCreditThreshold): void {
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

  list(): CappedCreditThreshold[] {
    const out: CappedCreditThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCreditThresholdStore(): CappedCreditThresholdStore {
  return new MemoryCappedCreditThresholdStore(new Map<string, CappedCreditThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCreditThresholdStore implements CappedCreditThresholdStore {
  inner: CappedCreditThresholdStore;
  cache: cache.TtlCache<CappedCreditThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCreditThresholdStore,
    cacheValue: cache.TtlCache<CappedCreditThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCreditThreshold | undefined {
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

  save(item: CappedCreditThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCreditThreshold[] {
    return this.inner.list();
  }
}

export function newCachedCappedCreditThresholdStore(inner: CappedCreditThresholdStore, ttl: number, clockValue: clock.Clock): CappedCreditThresholdStore {
  return new CachedCappedCreditThresholdStore(
    inner,
    cache.newTtlCache<CappedCreditThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped credit thresholds. Empty fields match all. */
export class CappedCreditThresholdQuery {
  category: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCreditThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCreditThreshold[]): CappedCreditThreshold[] {
    const matched = collections.filter(items, (candidate: CappedCreditThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCreditThresholds(store: CappedCreditThresholdStore, query: CappedCreditThresholdQuery): CappedCreditThreshold[] {
  return query.apply(store.list());
}
