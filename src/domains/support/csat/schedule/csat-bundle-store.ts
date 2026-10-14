import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatBundle } from "./csat-bundle.js";

/** Keeps csat bundles by code. */
export interface CsatBundleStore {
  find(code: string): CsatBundle | undefined;
  save(item: CsatBundle): void;
  remove(code: string): boolean;
  list(): CsatBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatBundleStore implements CsatBundleStore {
  items: Map<string, CsatBundle>;
  order: string[];

  constructor(items: Map<string, CsatBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatBundle): void {
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

  list(): CsatBundle[] {
    const out: CsatBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatBundleStore(): CsatBundleStore {
  return new MemoryCsatBundleStore(new Map<string, CsatBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatBundleStore implements CsatBundleStore {
  inner: CsatBundleStore;
  cache: cache.TtlCache<CsatBundle>;
  hits: number;
  misses: number;

  constructor(inner: CsatBundleStore, cacheValue: cache.TtlCache<CsatBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatBundle | undefined {
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

  save(item: CsatBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatBundle[] {
    return this.inner.list();
  }
}

export function newCachedCsatBundleStore(inner: CsatBundleStore, ttl: number, clockValue: clock.Clock): CsatBundleStore {
  return new CachedCsatBundleStore(inner, cache.newTtlCache<CsatBundle>(512, ttl, clockValue), 0, 0);
}

/** Selects csat bundles. Empty fields match all. */
export class CsatBundleQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatBundle[]): CsatBundle[] {
    const matched = collections.filter(items, (candidate: CsatBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatBundles(store: CsatBundleStore, query: CsatBundleQuery): CsatBundle[] {
  return query.apply(store.list());
}
