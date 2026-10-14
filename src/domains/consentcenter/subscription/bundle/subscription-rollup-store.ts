import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionRollup } from "./subscription-rollup.js";

/** Keeps subscription rollups by code. */
export interface SubscriptionRollupStore {
  find(code: string): SubscriptionRollup | undefined;
  save(item: SubscriptionRollup): void;
  remove(code: string): boolean;
  list(): SubscriptionRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionRollupStore implements SubscriptionRollupStore {
  items: Map<string, SubscriptionRollup>;
  order: string[];

  constructor(items: Map<string, SubscriptionRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionRollup): void {
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

  list(): SubscriptionRollup[] {
    const out: SubscriptionRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionRollupStore(): SubscriptionRollupStore {
  return new MemorySubscriptionRollupStore(new Map<string, SubscriptionRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionRollupStore implements SubscriptionRollupStore {
  inner: SubscriptionRollupStore;
  cache: cache.TtlCache<SubscriptionRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionRollupStore,
    cacheValue: cache.TtlCache<SubscriptionRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionRollup | undefined {
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

  save(item: SubscriptionRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionRollup[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionRollupStore(inner: SubscriptionRollupStore, ttl: number, clockValue: clock.Clock): SubscriptionRollupStore {
  return new CachedSubscriptionRollupStore(inner, cache.newTtlCache<SubscriptionRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects subscription rollups. Empty fields match all. */
export class SubscriptionRollupQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionRollup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionRollup[]): SubscriptionRollup[] {
    const matched = collections.filter(items, (candidate: SubscriptionRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionRollups(store: SubscriptionRollupStore, query: SubscriptionRollupQuery): SubscriptionRollup[] {
  return query.apply(store.list());
}
