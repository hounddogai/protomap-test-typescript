import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

/** Keeps manual touchpoint bundles by code. */
export interface ManualTouchpointBundleStore {
  find(code: string): ManualTouchpointBundle | undefined;
  save(item: ManualTouchpointBundle): void;
  remove(code: string): boolean;
  list(): ManualTouchpointBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTouchpointBundleStore implements ManualTouchpointBundleStore {
  items: Map<string, ManualTouchpointBundle>;
  order: string[];

  constructor(items: Map<string, ManualTouchpointBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTouchpointBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTouchpointBundle): void {
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

  list(): ManualTouchpointBundle[] {
    const out: ManualTouchpointBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTouchpointBundleStore(): ManualTouchpointBundleStore {
  return new MemoryManualTouchpointBundleStore(new Map<string, ManualTouchpointBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTouchpointBundleStore implements ManualTouchpointBundleStore {
  inner: ManualTouchpointBundleStore;
  cache: cache.TtlCache<ManualTouchpointBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTouchpointBundleStore,
    cacheValue: cache.TtlCache<ManualTouchpointBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTouchpointBundle | undefined {
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

  save(item: ManualTouchpointBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTouchpointBundle[] {
    return this.inner.list();
  }
}

export function newCachedManualTouchpointBundleStore(inner: ManualTouchpointBundleStore, ttl: number, clockValue: clock.Clock): ManualTouchpointBundleStore {
  return new CachedManualTouchpointBundleStore(
    inner,
    cache.newTtlCache<ManualTouchpointBundle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual touchpoint bundles. Empty fields match all. */
export class ManualTouchpointBundleQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTouchpointBundle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTouchpointBundle[]): ManualTouchpointBundle[] {
    const matched = collections.filter(items, (candidate: ManualTouchpointBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTouchpointBundles(store: ManualTouchpointBundleStore, query: ManualTouchpointBundleQuery): ManualTouchpointBundle[] {
  return query.apply(store.list());
}
