import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

/** Keeps capped enrollment estimates by code. */
export interface CappedEnrollmentEstimateStore {
  find(code: string): CappedEnrollmentEstimate | undefined;
  save(item: CappedEnrollmentEstimate): void;
  remove(code: string): boolean;
  list(): CappedEnrollmentEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedEnrollmentEstimateStore implements CappedEnrollmentEstimateStore {
  items: Map<string, CappedEnrollmentEstimate>;
  order: string[];

  constructor(items: Map<string, CappedEnrollmentEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedEnrollmentEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedEnrollmentEstimate): void {
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

  list(): CappedEnrollmentEstimate[] {
    const out: CappedEnrollmentEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedEnrollmentEstimateStore(): CappedEnrollmentEstimateStore {
  return new MemoryCappedEnrollmentEstimateStore(new Map<string, CappedEnrollmentEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedEnrollmentEstimateStore implements CappedEnrollmentEstimateStore {
  inner: CappedEnrollmentEstimateStore;
  cache: cache.TtlCache<CappedEnrollmentEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedEnrollmentEstimateStore,
    cacheValue: cache.TtlCache<CappedEnrollmentEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedEnrollmentEstimate | undefined {
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

  save(item: CappedEnrollmentEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedEnrollmentEstimate[] {
    return this.inner.list();
  }
}

export function newCachedCappedEnrollmentEstimateStore(inner: CappedEnrollmentEstimateStore, ttl: number, clockValue: clock.Clock): CappedEnrollmentEstimateStore {
  return new CachedCappedEnrollmentEstimateStore(
    inner,
    cache.newTtlCache<CappedEnrollmentEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped enrollment estimates. Empty fields match all. */
export class CappedEnrollmentEstimateQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedEnrollmentEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedEnrollmentEstimate[]): CappedEnrollmentEstimate[] {
    const matched = collections.filter(items, (candidate: CappedEnrollmentEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedEnrollmentEstimates(store: CappedEnrollmentEstimateStore, query: CappedEnrollmentEstimateQuery): CappedEnrollmentEstimate[] {
  return query.apply(store.list());
}
