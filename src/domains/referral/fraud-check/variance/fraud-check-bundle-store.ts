import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckBundle } from "./fraud-check-bundle.js";

/** Keeps fraud check bundles by code. */
export interface FraudCheckBundleStore {
  find(code: string): FraudCheckBundle | undefined;
  save(item: FraudCheckBundle): void;
  remove(code: string): boolean;
  list(): FraudCheckBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckBundleStore implements FraudCheckBundleStore {
  items: Map<string, FraudCheckBundle>;
  order: string[];

  constructor(items: Map<string, FraudCheckBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckBundle): void {
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

  list(): FraudCheckBundle[] {
    const out: FraudCheckBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckBundleStore(): FraudCheckBundleStore {
  return new MemoryFraudCheckBundleStore(new Map<string, FraudCheckBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckBundleStore implements FraudCheckBundleStore {
  inner: FraudCheckBundleStore;
  cache: cache.TtlCache<FraudCheckBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckBundleStore,
    cacheValue: cache.TtlCache<FraudCheckBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckBundle | undefined {
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

  save(item: FraudCheckBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckBundle[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckBundleStore(inner: FraudCheckBundleStore, ttl: number, clockValue: clock.Clock): FraudCheckBundleStore {
  return new CachedFraudCheckBundleStore(inner, cache.newTtlCache<FraudCheckBundle>(256, ttl, clockValue), 0, 0);
}

/** Selects fraud check bundles. Empty fields match all. */
export class FraudCheckBundleQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckBundle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckBundle[]): FraudCheckBundle[] {
    const matched = collections.filter(items, (candidate: FraudCheckBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckBundles(store: FraudCheckBundleStore, query: FraudCheckBundleQuery): FraudCheckBundle[] {
  return query.apply(store.list());
}
