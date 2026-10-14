import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditVariance } from "./credit-variance.js";

/** Keeps credit variances by code. */
export interface CreditVarianceStore {
  find(code: string): CreditVariance | undefined;
  save(item: CreditVariance): void;
  remove(code: string): boolean;
  list(): CreditVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditVarianceStore implements CreditVarianceStore {
  items: Map<string, CreditVariance>;
  order: string[];

  constructor(items: Map<string, CreditVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditVariance): void {
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

  list(): CreditVariance[] {
    const out: CreditVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditVarianceStore(): CreditVarianceStore {
  return new MemoryCreditVarianceStore(new Map<string, CreditVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditVarianceStore implements CreditVarianceStore {
  inner: CreditVarianceStore;
  cache: cache.TtlCache<CreditVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: CreditVarianceStore,
    cacheValue: cache.TtlCache<CreditVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditVariance | undefined {
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

  save(item: CreditVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditVariance[] {
    return this.inner.list();
  }
}

export function newCachedCreditVarianceStore(inner: CreditVarianceStore, ttl: number, clockValue: clock.Clock): CreditVarianceStore {
  return new CachedCreditVarianceStore(inner, cache.newTtlCache<CreditVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit variances. Empty fields match all. */
export class CreditVarianceQuery {
  title: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWindowDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditVariance[]): CreditVariance[] {
    const matched = collections.filter(items, (candidate: CreditVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditVariances(store: CreditVarianceStore, query: CreditVarianceQuery): CreditVariance[] {
  return query.apply(store.list());
}
