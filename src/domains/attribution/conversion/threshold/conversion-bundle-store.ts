import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionBundle } from "./conversion-bundle.js";

/** Keeps conversion bundles by code. */
export interface ConversionBundleStore {
  find(code: string): ConversionBundle | undefined;
  save(item: ConversionBundle): void;
  remove(code: string): boolean;
  list(): ConversionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionBundleStore implements ConversionBundleStore {
  items: Map<string, ConversionBundle>;
  order: string[];

  constructor(items: Map<string, ConversionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionBundle): void {
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

  list(): ConversionBundle[] {
    const out: ConversionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionBundleStore(): ConversionBundleStore {
  return new MemoryConversionBundleStore(new Map<string, ConversionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionBundleStore implements ConversionBundleStore {
  inner: ConversionBundleStore;
  cache: cache.TtlCache<ConversionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionBundleStore,
    cacheValue: cache.TtlCache<ConversionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionBundle | undefined {
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

  save(item: ConversionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionBundle[] {
    return this.inner.list();
  }
}

export function newCachedConversionBundleStore(inner: ConversionBundleStore, ttl: number, clockValue: clock.Clock): ConversionBundleStore {
  return new CachedConversionBundleStore(inner, cache.newTtlCache<ConversionBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects conversion bundles. Empty fields match all. */
export class ConversionBundleQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionBundle): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionBundle[]): ConversionBundle[] {
    const matched = collections.filter(items, (candidate: ConversionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionBundles(store: ConversionBundleStore, query: ConversionBundleQuery): ConversionBundle[] {
  return query.apply(store.list());
}
