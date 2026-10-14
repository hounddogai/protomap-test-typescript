import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRewardException } from "./manual-reward-exception.js";

/** Keeps manual reward exceptions by code. */
export interface ManualRewardExceptionStore {
  find(code: string): ManualRewardException | undefined;
  save(item: ManualRewardException): void;
  remove(code: string): boolean;
  list(): ManualRewardException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRewardExceptionStore implements ManualRewardExceptionStore {
  items: Map<string, ManualRewardException>;
  order: string[];

  constructor(items: Map<string, ManualRewardException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRewardException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRewardException): void {
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

  list(): ManualRewardException[] {
    const out: ManualRewardException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRewardExceptionStore(): ManualRewardExceptionStore {
  return new MemoryManualRewardExceptionStore(new Map<string, ManualRewardException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRewardExceptionStore implements ManualRewardExceptionStore {
  inner: ManualRewardExceptionStore;
  cache: cache.TtlCache<ManualRewardException>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRewardExceptionStore,
    cacheValue: cache.TtlCache<ManualRewardException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRewardException | undefined {
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

  save(item: ManualRewardException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRewardException[] {
    return this.inner.list();
  }
}

export function newCachedManualRewardExceptionStore(inner: ManualRewardExceptionStore, ttl: number, clockValue: clock.Clock): ManualRewardExceptionStore {
  return new CachedManualRewardExceptionStore(
    inner,
    cache.newTtlCache<ManualRewardException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual reward exceptions. Empty fields match all. */
export class ManualRewardExceptionQuery {
  country: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minAmount: number, statuses: string[], limit: number) {
    this.country = country;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRewardException): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRewardException[]): ManualRewardException[] {
    const matched = collections.filter(items, (candidate: ManualRewardException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRewardExceptions(store: ManualRewardExceptionStore, query: ManualRewardExceptionQuery): ManualRewardException[] {
  return query.apply(store.list());
}
