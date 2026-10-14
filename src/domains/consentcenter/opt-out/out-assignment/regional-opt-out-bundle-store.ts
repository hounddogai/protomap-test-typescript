import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalOptOutBundle } from "./regional-opt-out-bundle.js";

/** Keeps regional opt out bundles by code. */
export interface RegionalOptOutBundleStore {
  find(code: string): RegionalOptOutBundle | undefined;
  save(item: RegionalOptOutBundle): void;
  remove(code: string): boolean;
  list(): RegionalOptOutBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalOptOutBundleStore implements RegionalOptOutBundleStore {
  items: Map<string, RegionalOptOutBundle>;
  order: string[];

  constructor(items: Map<string, RegionalOptOutBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalOptOutBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalOptOutBundle): void {
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

  list(): RegionalOptOutBundle[] {
    const out: RegionalOptOutBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalOptOutBundleStore(): RegionalOptOutBundleStore {
  return new MemoryRegionalOptOutBundleStore(new Map<string, RegionalOptOutBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalOptOutBundleStore implements RegionalOptOutBundleStore {
  inner: RegionalOptOutBundleStore;
  cache: cache.TtlCache<RegionalOptOutBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalOptOutBundleStore,
    cacheValue: cache.TtlCache<RegionalOptOutBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalOptOutBundle | undefined {
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

  save(item: RegionalOptOutBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalOptOutBundle[] {
    return this.inner.list();
  }
}

export function newCachedRegionalOptOutBundleStore(inner: RegionalOptOutBundleStore, ttl: number, clockValue: clock.Clock): RegionalOptOutBundleStore {
  return new CachedRegionalOptOutBundleStore(inner, cache.newTtlCache<RegionalOptOutBundle>(64, ttl, clockValue), 0, 0);
}

/** Selects regional opt out bundles. Empty fields match all. */
export class RegionalOptOutBundleQuery {
  locale: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minImpressions: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalOptOutBundle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalOptOutBundle[]): RegionalOptOutBundle[] {
    const matched = collections.filter(items, (candidate: RegionalOptOutBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalOptOutBundles(store: RegionalOptOutBundleStore, query: RegionalOptOutBundleQuery): RegionalOptOutBundle[] {
  return query.apply(store.list());
}
