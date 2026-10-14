import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictSubscriptionBundle } from "./strict-subscription-bundle.js";

/** Keeps strict subscription bundles by code. */
export interface StrictSubscriptionBundleStore {
  find(code: string): StrictSubscriptionBundle | undefined;
  save(item: StrictSubscriptionBundle): void;
  remove(code: string): boolean;
  list(): StrictSubscriptionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictSubscriptionBundleStore implements StrictSubscriptionBundleStore {
  items: Map<string, StrictSubscriptionBundle>;
  order: string[];

  constructor(items: Map<string, StrictSubscriptionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictSubscriptionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictSubscriptionBundle): void {
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

  list(): StrictSubscriptionBundle[] {
    const out: StrictSubscriptionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictSubscriptionBundleStore(): StrictSubscriptionBundleStore {
  return new MemoryStrictSubscriptionBundleStore(new Map<string, StrictSubscriptionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictSubscriptionBundleStore implements StrictSubscriptionBundleStore {
  inner: StrictSubscriptionBundleStore;
  cache: cache.TtlCache<StrictSubscriptionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictSubscriptionBundleStore,
    cacheValue: cache.TtlCache<StrictSubscriptionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictSubscriptionBundle | undefined {
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

  save(item: StrictSubscriptionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictSubscriptionBundle[] {
    return this.inner.list();
  }
}

export function newCachedStrictSubscriptionBundleStore(inner: StrictSubscriptionBundleStore, ttl: number, clockValue: clock.Clock): StrictSubscriptionBundleStore {
  return new CachedStrictSubscriptionBundleStore(
    inner,
    cache.newTtlCache<StrictSubscriptionBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict subscription bundles. Empty fields match all. */
export class StrictSubscriptionBundleQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictSubscriptionBundle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictSubscriptionBundle[]): StrictSubscriptionBundle[] {
    const matched = collections.filter(items, (candidate: StrictSubscriptionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictSubscriptionBundles(store: StrictSubscriptionBundleStore, query: StrictSubscriptionBundleQuery): StrictSubscriptionBundle[] {
  return query.apply(store.list());
}
