import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryCreativeBundle } from "./primary-creative-bundle.js";

/** Keeps primary creative bundles by code. */
export interface PrimaryCreativeBundleStore {
  find(code: string): PrimaryCreativeBundle | undefined;
  save(item: PrimaryCreativeBundle): void;
  remove(code: string): boolean;
  list(): PrimaryCreativeBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryCreativeBundleStore implements PrimaryCreativeBundleStore {
  items: Map<string, PrimaryCreativeBundle>;
  order: string[];

  constructor(items: Map<string, PrimaryCreativeBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryCreativeBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryCreativeBundle): void {
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

  list(): PrimaryCreativeBundle[] {
    const out: PrimaryCreativeBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryCreativeBundleStore(): PrimaryCreativeBundleStore {
  return new MemoryPrimaryCreativeBundleStore(new Map<string, PrimaryCreativeBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryCreativeBundleStore implements PrimaryCreativeBundleStore {
  inner: PrimaryCreativeBundleStore;
  cache: cache.TtlCache<PrimaryCreativeBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryCreativeBundleStore,
    cacheValue: cache.TtlCache<PrimaryCreativeBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryCreativeBundle | undefined {
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

  save(item: PrimaryCreativeBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryCreativeBundle[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryCreativeBundleStore(inner: PrimaryCreativeBundleStore, ttl: number, clockValue: clock.Clock): PrimaryCreativeBundleStore {
  return new CachedPrimaryCreativeBundleStore(
    inner,
    cache.newTtlCache<PrimaryCreativeBundle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary creative bundles. Empty fields match all. */
export class PrimaryCreativeBundleQuery {
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

  matches(item: PrimaryCreativeBundle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryCreativeBundle[]): PrimaryCreativeBundle[] {
    const matched = collections.filter(items, (candidate: PrimaryCreativeBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryCreativeBundles(store: PrimaryCreativeBundleStore, query: PrimaryCreativeBundleQuery): PrimaryCreativeBundle[] {
  return query.apply(store.list());
}
