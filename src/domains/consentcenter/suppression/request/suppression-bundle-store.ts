import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionBundle } from "./suppression-bundle.js";

/** Keeps suppression bundles by code. */
export interface SuppressionBundleStore {
  find(code: string): SuppressionBundle | undefined;
  save(item: SuppressionBundle): void;
  remove(code: string): boolean;
  list(): SuppressionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionBundleStore implements SuppressionBundleStore {
  items: Map<string, SuppressionBundle>;
  order: string[];

  constructor(items: Map<string, SuppressionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionBundle): void {
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

  list(): SuppressionBundle[] {
    const out: SuppressionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionBundleStore(): SuppressionBundleStore {
  return new MemorySuppressionBundleStore(new Map<string, SuppressionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionBundleStore implements SuppressionBundleStore {
  inner: SuppressionBundleStore;
  cache: cache.TtlCache<SuppressionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionBundleStore,
    cacheValue: cache.TtlCache<SuppressionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionBundle | undefined {
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

  save(item: SuppressionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionBundle[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionBundleStore(inner: SuppressionBundleStore, ttl: number, clockValue: clock.Clock): SuppressionBundleStore {
  return new CachedSuppressionBundleStore(inner, cache.newTtlCache<SuppressionBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression bundles. Empty fields match all. */
export class SuppressionBundleQuery {
  name: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionBundle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionBundle[]): SuppressionBundle[] {
    const matched = collections.filter(items, (candidate: SuppressionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionBundles(store: SuppressionBundleStore, query: SuppressionBundleQuery): SuppressionBundle[] {
  return query.apply(store.list());
}
