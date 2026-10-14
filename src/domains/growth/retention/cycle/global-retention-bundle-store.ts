import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRetentionBundle } from "./global-retention-bundle.js";

/** Keeps global retention bundles by code. */
export interface GlobalRetentionBundleStore {
  find(code: string): GlobalRetentionBundle | undefined;
  save(item: GlobalRetentionBundle): void;
  remove(code: string): boolean;
  list(): GlobalRetentionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRetentionBundleStore implements GlobalRetentionBundleStore {
  items: Map<string, GlobalRetentionBundle>;
  order: string[];

  constructor(items: Map<string, GlobalRetentionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRetentionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRetentionBundle): void {
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

  list(): GlobalRetentionBundle[] {
    const out: GlobalRetentionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRetentionBundleStore(): GlobalRetentionBundleStore {
  return new MemoryGlobalRetentionBundleStore(new Map<string, GlobalRetentionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRetentionBundleStore implements GlobalRetentionBundleStore {
  inner: GlobalRetentionBundleStore;
  cache: cache.TtlCache<GlobalRetentionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRetentionBundleStore,
    cacheValue: cache.TtlCache<GlobalRetentionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRetentionBundle | undefined {
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

  save(item: GlobalRetentionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRetentionBundle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRetentionBundleStore(inner: GlobalRetentionBundleStore, ttl: number, clockValue: clock.Clock): GlobalRetentionBundleStore {
  return new CachedGlobalRetentionBundleStore(
    inner,
    cache.newTtlCache<GlobalRetentionBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global retention bundles. Empty fields match all. */
export class GlobalRetentionBundleQuery {
  name: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minOpenRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRetentionBundle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRetentionBundle[]): GlobalRetentionBundle[] {
    const matched = collections.filter(items, (candidate: GlobalRetentionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRetentionBundles(store: GlobalRetentionBundleStore, query: GlobalRetentionBundleQuery): GlobalRetentionBundle[] {
  return query.apply(store.list());
}
