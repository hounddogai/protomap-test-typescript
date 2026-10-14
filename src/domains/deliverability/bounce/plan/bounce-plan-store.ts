import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BouncePlan } from "./bounce-plan.js";

/** Keeps bounce plans by code. */
export interface BouncePlanStore {
  find(code: string): BouncePlan | undefined;
  save(item: BouncePlan): void;
  remove(code: string): boolean;
  list(): BouncePlan[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBouncePlanStore implements BouncePlanStore {
  items: Map<string, BouncePlan>;
  order: string[];

  constructor(items: Map<string, BouncePlan>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BouncePlan | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BouncePlan): void {
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

  list(): BouncePlan[] {
    const out: BouncePlan[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBouncePlanStore(): BouncePlanStore {
  return new MemoryBouncePlanStore(new Map<string, BouncePlan>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBouncePlanStore implements BouncePlanStore {
  inner: BouncePlanStore;
  cache: cache.TtlCache<BouncePlan>;
  hits: number;
  misses: number;

  constructor(inner: BouncePlanStore, cacheValue: cache.TtlCache<BouncePlan>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BouncePlan | undefined {
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

  save(item: BouncePlan): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BouncePlan[] {
    return this.inner.list();
  }
}

export function newCachedBouncePlanStore(inner: BouncePlanStore, ttl: number, clockValue: clock.Clock): BouncePlanStore {
  return new CachedBouncePlanStore(inner, cache.newTtlCache<BouncePlan>(64, ttl, clockValue), 0, 0);
}

/** Selects bounce plans. Empty fields match all. */
export class BouncePlanQuery {
  category: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCapacity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BouncePlan): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BouncePlan[]): BouncePlan[] {
    const matched = collections.filter(items, (candidate: BouncePlan): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBouncePlans(store: BouncePlanStore, query: BouncePlanQuery): BouncePlan[] {
  return query.apply(store.list());
}
