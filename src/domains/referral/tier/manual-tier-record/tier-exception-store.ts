import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierException } from "./tier-exception.js";

/** Keeps tier exceptions by code. */
export interface TierExceptionStore {
  find(code: string): TierException | undefined;
  save(item: TierException): void;
  remove(code: string): boolean;
  list(): TierException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierExceptionStore implements TierExceptionStore {
  items: Map<string, TierException>;
  order: string[];

  constructor(items: Map<string, TierException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierException): void {
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

  list(): TierException[] {
    const out: TierException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierExceptionStore(): TierExceptionStore {
  return new MemoryTierExceptionStore(new Map<string, TierException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierExceptionStore implements TierExceptionStore {
  inner: TierExceptionStore;
  cache: cache.TtlCache<TierException>;
  hits: number;
  misses: number;

  constructor(inner: TierExceptionStore, cacheValue: cache.TtlCache<TierException>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierException | undefined {
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

  save(item: TierException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierException[] {
    return this.inner.list();
  }
}

export function newCachedTierExceptionStore(inner: TierExceptionStore, ttl: number, clockValue: clock.Clock): TierExceptionStore {
  return new CachedTierExceptionStore(inner, cache.newTtlCache<TierException>(128, ttl, clockValue), 0, 0);
}

/** Selects tier exceptions. Empty fields match all. */
export class TierExceptionQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierException[]): TierException[] {
    const matched = collections.filter(items, (candidate: TierException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierExceptions(store: TierExceptionStore, query: TierExceptionQuery): TierException[] {
  return query.apply(store.list());
}
