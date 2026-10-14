import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingModelBundle } from "./rolling-model-bundle.js";

/** Keeps rolling model bundles by code. */
export interface RollingModelBundleStore {
  find(code: string): RollingModelBundle | undefined;
  save(item: RollingModelBundle): void;
  remove(code: string): boolean;
  list(): RollingModelBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingModelBundleStore implements RollingModelBundleStore {
  items: Map<string, RollingModelBundle>;
  order: string[];

  constructor(items: Map<string, RollingModelBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingModelBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingModelBundle): void {
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

  list(): RollingModelBundle[] {
    const out: RollingModelBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingModelBundleStore(): RollingModelBundleStore {
  return new MemoryRollingModelBundleStore(new Map<string, RollingModelBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingModelBundleStore implements RollingModelBundleStore {
  inner: RollingModelBundleStore;
  cache: cache.TtlCache<RollingModelBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingModelBundleStore,
    cacheValue: cache.TtlCache<RollingModelBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingModelBundle | undefined {
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

  save(item: RollingModelBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingModelBundle[] {
    return this.inner.list();
  }
}

export function newCachedRollingModelBundleStore(inner: RollingModelBundleStore, ttl: number, clockValue: clock.Clock): RollingModelBundleStore {
  return new CachedRollingModelBundleStore(inner, cache.newTtlCache<RollingModelBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling model bundles. Empty fields match all. */
export class RollingModelBundleQuery {
  source: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minConversionRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingModelBundle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingModelBundle[]): RollingModelBundle[] {
    const matched = collections.filter(items, (candidate: RollingModelBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingModelBundles(store: RollingModelBundleStore, query: RollingModelBundleQuery): RollingModelBundle[] {
  return query.apply(store.list());
}
