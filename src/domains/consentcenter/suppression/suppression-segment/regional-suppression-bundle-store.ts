import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalSuppressionBundle } from "./regional-suppression-bundle.js";

/** Keeps regional suppression bundles by code. */
export interface RegionalSuppressionBundleStore {
  find(code: string): RegionalSuppressionBundle | undefined;
  save(item: RegionalSuppressionBundle): void;
  remove(code: string): boolean;
  list(): RegionalSuppressionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalSuppressionBundleStore implements RegionalSuppressionBundleStore {
  items: Map<string, RegionalSuppressionBundle>;
  order: string[];

  constructor(items: Map<string, RegionalSuppressionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalSuppressionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalSuppressionBundle): void {
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

  list(): RegionalSuppressionBundle[] {
    const out: RegionalSuppressionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalSuppressionBundleStore(): RegionalSuppressionBundleStore {
  return new MemoryRegionalSuppressionBundleStore(new Map<string, RegionalSuppressionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalSuppressionBundleStore implements RegionalSuppressionBundleStore {
  inner: RegionalSuppressionBundleStore;
  cache: cache.TtlCache<RegionalSuppressionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalSuppressionBundleStore,
    cacheValue: cache.TtlCache<RegionalSuppressionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalSuppressionBundle | undefined {
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

  save(item: RegionalSuppressionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalSuppressionBundle[] {
    return this.inner.list();
  }
}

export function newCachedRegionalSuppressionBundleStore(inner: RegionalSuppressionBundleStore, ttl: number, clockValue: clock.Clock): RegionalSuppressionBundleStore {
  return new CachedRegionalSuppressionBundleStore(
    inner,
    cache.newTtlCache<RegionalSuppressionBundle>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional suppression bundles. Empty fields match all. */
export class RegionalSuppressionBundleQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalSuppressionBundle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalSuppressionBundle[]): RegionalSuppressionBundle[] {
    const matched = collections.filter(items, (candidate: RegionalSuppressionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalSuppressionBundles(store: RegionalSuppressionBundleStore, query: RegionalSuppressionBundleQuery): RegionalSuppressionBundle[] {
  return query.apply(store.list());
}
