import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierBundle } from "./tier-bundle.js";

/** Keeps tier bundles by code. */
export interface TierBundleStore {
  find(code: string): TierBundle | undefined;
  save(item: TierBundle): void;
  remove(code: string): boolean;
  list(): TierBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierBundleStore implements TierBundleStore {
  items: Map<string, TierBundle>;
  order: string[];

  constructor(items: Map<string, TierBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierBundle): void {
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

  list(): TierBundle[] {
    const out: TierBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierBundleStore(): TierBundleStore {
  return new MemoryTierBundleStore(new Map<string, TierBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierBundleStore implements TierBundleStore {
  inner: TierBundleStore;
  cache: cache.TtlCache<TierBundle>;
  hits: number;
  misses: number;

  constructor(inner: TierBundleStore, cacheValue: cache.TtlCache<TierBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierBundle | undefined {
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

  save(item: TierBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierBundle[] {
    return this.inner.list();
  }
}

export function newCachedTierBundleStore(inner: TierBundleStore, ttl: number, clockValue: clock.Clock): TierBundleStore {
  return new CachedTierBundleStore(inner, cache.newTtlCache<TierBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects tier bundles. Empty fields match all. */
export class TierBundleQuery {
  utmSource: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minStartsAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierBundle[]): TierBundle[] {
    const matched = collections.filter(items, (candidate: TierBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierBundles(store: TierBundleStore, query: TierBundleQuery): TierBundle[] {
  return query.apply(store.list());
}
