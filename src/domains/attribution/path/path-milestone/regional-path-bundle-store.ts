import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPathBundle } from "./regional-path-bundle.js";

/** Keeps regional path bundles by code. */
export interface RegionalPathBundleStore {
  find(code: string): RegionalPathBundle | undefined;
  save(item: RegionalPathBundle): void;
  remove(code: string): boolean;
  list(): RegionalPathBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPathBundleStore implements RegionalPathBundleStore {
  items: Map<string, RegionalPathBundle>;
  order: string[];

  constructor(items: Map<string, RegionalPathBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPathBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPathBundle): void {
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

  list(): RegionalPathBundle[] {
    const out: RegionalPathBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPathBundleStore(): RegionalPathBundleStore {
  return new MemoryRegionalPathBundleStore(new Map<string, RegionalPathBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPathBundleStore implements RegionalPathBundleStore {
  inner: RegionalPathBundleStore;
  cache: cache.TtlCache<RegionalPathBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPathBundleStore,
    cacheValue: cache.TtlCache<RegionalPathBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPathBundle | undefined {
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

  save(item: RegionalPathBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPathBundle[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPathBundleStore(inner: RegionalPathBundleStore, ttl: number, clockValue: clock.Clock): RegionalPathBundleStore {
  return new CachedRegionalPathBundleStore(inner, cache.newTtlCache<RegionalPathBundle>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional path bundles. Empty fields match all. */
export class RegionalPathBundleQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPathBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPathBundle[]): RegionalPathBundle[] {
    const matched = collections.filter(items, (candidate: RegionalPathBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPathBundles(store: RegionalPathBundleStore, query: RegionalPathBundleQuery): RegionalPathBundle[] {
  return query.apply(store.list());
}
