import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeBundle } from "./adaptive-creative-bundle.js";

/** Keeps adaptive creative bundles by code. */
export interface AdaptiveCreativeBundleStore {
  find(code: string): AdaptiveCreativeBundle | undefined;
  save(item: AdaptiveCreativeBundle): void;
  remove(code: string): boolean;
  list(): AdaptiveCreativeBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCreativeBundleStore implements AdaptiveCreativeBundleStore {
  items: Map<string, AdaptiveCreativeBundle>;
  order: string[];

  constructor(items: Map<string, AdaptiveCreativeBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCreativeBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCreativeBundle): void {
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

  list(): AdaptiveCreativeBundle[] {
    const out: AdaptiveCreativeBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCreativeBundleStore(): AdaptiveCreativeBundleStore {
  return new MemoryAdaptiveCreativeBundleStore(new Map<string, AdaptiveCreativeBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCreativeBundleStore implements AdaptiveCreativeBundleStore {
  inner: AdaptiveCreativeBundleStore;
  cache: cache.TtlCache<AdaptiveCreativeBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCreativeBundleStore,
    cacheValue: cache.TtlCache<AdaptiveCreativeBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCreativeBundle | undefined {
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

  save(item: AdaptiveCreativeBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCreativeBundle[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCreativeBundleStore(inner: AdaptiveCreativeBundleStore, ttl: number, clockValue: clock.Clock): AdaptiveCreativeBundleStore {
  return new CachedAdaptiveCreativeBundleStore(
    inner,
    cache.newTtlCache<AdaptiveCreativeBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive creative bundles. Empty fields match all. */
export class AdaptiveCreativeBundleQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCreativeBundle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCreativeBundle[]): AdaptiveCreativeBundle[] {
    const matched = collections.filter(items, (candidate: AdaptiveCreativeBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCreativeBundles(store: AdaptiveCreativeBundleStore, query: AdaptiveCreativeBundleQuery): AdaptiveCreativeBundle[] {
  return query.apply(store.list());
}
