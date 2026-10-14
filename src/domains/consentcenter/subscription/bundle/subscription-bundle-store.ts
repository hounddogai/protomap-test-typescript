import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionBundle } from "./subscription-bundle.js";

/** Keeps subscription bundles by code. */
export interface SubscriptionBundleStore {
  find(code: string): SubscriptionBundle | undefined;
  save(item: SubscriptionBundle): void;
  remove(code: string): boolean;
  list(): SubscriptionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionBundleStore implements SubscriptionBundleStore {
  items: Map<string, SubscriptionBundle>;
  order: string[];

  constructor(items: Map<string, SubscriptionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionBundle): void {
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

  list(): SubscriptionBundle[] {
    const out: SubscriptionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionBundleStore(): SubscriptionBundleStore {
  return new MemorySubscriptionBundleStore(new Map<string, SubscriptionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionBundleStore implements SubscriptionBundleStore {
  inner: SubscriptionBundleStore;
  cache: cache.TtlCache<SubscriptionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionBundleStore,
    cacheValue: cache.TtlCache<SubscriptionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionBundle | undefined {
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

  save(item: SubscriptionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionBundle[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionBundleStore(inner: SubscriptionBundleStore, ttl: number, clockValue: clock.Clock): SubscriptionBundleStore {
  return new CachedSubscriptionBundleStore(inner, cache.newTtlCache<SubscriptionBundle>(256, ttl, clockValue), 0, 0);
}

/** Selects subscription bundles. Empty fields match all. */
export class SubscriptionBundleQuery {
  country: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMinimum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionBundle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionBundle[]): SubscriptionBundle[] {
    const matched = collections.filter(items, (candidate: SubscriptionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionBundles(store: SubscriptionBundleStore, query: SubscriptionBundleQuery): SubscriptionBundle[] {
  return query.apply(store.list());
}
