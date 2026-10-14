import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionException } from "./subscription-exception.js";

/** Keeps subscription exceptions by code. */
export interface SubscriptionExceptionStore {
  find(code: string): SubscriptionException | undefined;
  save(item: SubscriptionException): void;
  remove(code: string): boolean;
  list(): SubscriptionException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionExceptionStore implements SubscriptionExceptionStore {
  items: Map<string, SubscriptionException>;
  order: string[];

  constructor(items: Map<string, SubscriptionException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionException): void {
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

  list(): SubscriptionException[] {
    const out: SubscriptionException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionExceptionStore(): SubscriptionExceptionStore {
  return new MemorySubscriptionExceptionStore(new Map<string, SubscriptionException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionExceptionStore implements SubscriptionExceptionStore {
  inner: SubscriptionExceptionStore;
  cache: cache.TtlCache<SubscriptionException>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionExceptionStore,
    cacheValue: cache.TtlCache<SubscriptionException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionException | undefined {
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

  save(item: SubscriptionException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionException[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionExceptionStore(inner: SubscriptionExceptionStore, ttl: number, clockValue: clock.Clock): SubscriptionExceptionStore {
  return new CachedSubscriptionExceptionStore(
    inner,
    cache.newTtlCache<SubscriptionException>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription exceptions. Empty fields match all. */
export class SubscriptionExceptionQuery {
  category: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minGraceDays: number, statuses: string[], limit: number) {
    this.category = category;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionException): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionException[]): SubscriptionException[] {
    const matched = collections.filter(items, (candidate: SubscriptionException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionExceptions(store: SubscriptionExceptionStore, query: SubscriptionExceptionQuery): SubscriptionException[] {
  return query.apply(store.list());
}
