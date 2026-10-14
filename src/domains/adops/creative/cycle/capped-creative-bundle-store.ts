import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCreativeBundle } from "./capped-creative-bundle.js";

/** Keeps capped creative bundles by code. */
export interface CappedCreativeBundleStore {
  find(code: string): CappedCreativeBundle | undefined;
  save(item: CappedCreativeBundle): void;
  remove(code: string): boolean;
  list(): CappedCreativeBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCreativeBundleStore implements CappedCreativeBundleStore {
  items: Map<string, CappedCreativeBundle>;
  order: string[];

  constructor(items: Map<string, CappedCreativeBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCreativeBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCreativeBundle): void {
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

  list(): CappedCreativeBundle[] {
    const out: CappedCreativeBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCreativeBundleStore(): CappedCreativeBundleStore {
  return new MemoryCappedCreativeBundleStore(new Map<string, CappedCreativeBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCreativeBundleStore implements CappedCreativeBundleStore {
  inner: CappedCreativeBundleStore;
  cache: cache.TtlCache<CappedCreativeBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCreativeBundleStore,
    cacheValue: cache.TtlCache<CappedCreativeBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCreativeBundle | undefined {
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

  save(item: CappedCreativeBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCreativeBundle[] {
    return this.inner.list();
  }
}

export function newCachedCappedCreativeBundleStore(inner: CappedCreativeBundleStore, ttl: number, clockValue: clock.Clock): CappedCreativeBundleStore {
  return new CachedCappedCreativeBundleStore(
    inner,
    cache.newTtlCache<CappedCreativeBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped creative bundles. Empty fields match all. */
export class CappedCreativeBundleQuery {
  utmSource: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRetries: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCreativeBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCreativeBundle[]): CappedCreativeBundle[] {
    const matched = collections.filter(items, (candidate: CappedCreativeBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCreativeBundles(store: CappedCreativeBundleStore, query: CappedCreativeBundleQuery): CappedCreativeBundle[] {
  return query.apply(store.list());
}
