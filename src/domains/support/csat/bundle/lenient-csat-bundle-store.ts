import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientCsatBundle } from "./lenient-csat-bundle.js";

/** Keeps lenient csat bundles by code. */
export interface LenientCsatBundleStore {
  find(code: string): LenientCsatBundle | undefined;
  save(item: LenientCsatBundle): void;
  remove(code: string): boolean;
  list(): LenientCsatBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientCsatBundleStore implements LenientCsatBundleStore {
  items: Map<string, LenientCsatBundle>;
  order: string[];

  constructor(items: Map<string, LenientCsatBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientCsatBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientCsatBundle): void {
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

  list(): LenientCsatBundle[] {
    const out: LenientCsatBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientCsatBundleStore(): LenientCsatBundleStore {
  return new MemoryLenientCsatBundleStore(new Map<string, LenientCsatBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientCsatBundleStore implements LenientCsatBundleStore {
  inner: LenientCsatBundleStore;
  cache: cache.TtlCache<LenientCsatBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientCsatBundleStore,
    cacheValue: cache.TtlCache<LenientCsatBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientCsatBundle | undefined {
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

  save(item: LenientCsatBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientCsatBundle[] {
    return this.inner.list();
  }
}

export function newCachedLenientCsatBundleStore(inner: LenientCsatBundleStore, ttl: number, clockValue: clock.Clock): LenientCsatBundleStore {
  return new CachedLenientCsatBundleStore(inner, cache.newTtlCache<LenientCsatBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient csat bundles. Empty fields match all. */
export class LenientCsatBundleQuery {
  category: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minWeight: number, statuses: string[], limit: number) {
    this.category = category;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientCsatBundle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientCsatBundle[]): LenientCsatBundle[] {
    const matched = collections.filter(items, (candidate: LenientCsatBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientCsatBundles(store: LenientCsatBundleStore, query: LenientCsatBundleQuery): LenientCsatBundle[] {
  return query.apply(store.list());
}
