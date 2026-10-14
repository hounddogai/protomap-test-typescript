import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBadgePlan } from "./strict-badge-plan.js";

/** Keeps strict badge plans by code. */
export interface StrictBadgePlanStore {
  find(code: string): StrictBadgePlan | undefined;
  save(item: StrictBadgePlan): void;
  remove(code: string): boolean;
  list(): StrictBadgePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBadgePlanStore implements StrictBadgePlanStore {
  items: Map<string, StrictBadgePlan>;
  order: string[];

  constructor(items: Map<string, StrictBadgePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBadgePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBadgePlan): void {
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

  list(): StrictBadgePlan[] {
    const out: StrictBadgePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBadgePlanStore(): StrictBadgePlanStore {
  return new MemoryStrictBadgePlanStore(new Map<string, StrictBadgePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBadgePlanStore implements StrictBadgePlanStore {
  inner: StrictBadgePlanStore;
  cache: cache.TtlCache<StrictBadgePlan>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBadgePlanStore,
    cacheValue: cache.TtlCache<StrictBadgePlan>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBadgePlan | undefined {
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

  save(item: StrictBadgePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBadgePlan[] {
    return this.inner.list();
  }
}

export function newCachedStrictBadgePlanStore(inner: StrictBadgePlanStore, ttl: number, clockValue: clock.Clock): StrictBadgePlanStore {
  return new CachedStrictBadgePlanStore(inner, cache.newTtlCache<StrictBadgePlan>(64, ttl, clockValue), 0, 0);
}

/** Selects strict badge plans. Empty fields match all. */
export class StrictBadgePlanQuery {
  segment: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRetries: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBadgePlan): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBadgePlan[]): StrictBadgePlan[] {
    const matched = collections.filter(items, (candidate: StrictBadgePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBadgePlans(store: StrictBadgePlanStore, query: StrictBadgePlanQuery): StrictBadgePlan[] {
  return query.apply(store.list());
}
