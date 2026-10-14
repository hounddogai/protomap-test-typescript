import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredComplaintBundle } from "./tiered-complaint-bundle.js";

/** Keeps tiered complaint bundles by code. */
export interface TieredComplaintBundleStore {
  find(code: string): TieredComplaintBundle | undefined;
  save(item: TieredComplaintBundle): void;
  remove(code: string): boolean;
  list(): TieredComplaintBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredComplaintBundleStore implements TieredComplaintBundleStore {
  items: Map<string, TieredComplaintBundle>;
  order: string[];

  constructor(items: Map<string, TieredComplaintBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredComplaintBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredComplaintBundle): void {
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

  list(): TieredComplaintBundle[] {
    const out: TieredComplaintBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredComplaintBundleStore(): TieredComplaintBundleStore {
  return new MemoryTieredComplaintBundleStore(new Map<string, TieredComplaintBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredComplaintBundleStore implements TieredComplaintBundleStore {
  inner: TieredComplaintBundleStore;
  cache: cache.TtlCache<TieredComplaintBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredComplaintBundleStore,
    cacheValue: cache.TtlCache<TieredComplaintBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredComplaintBundle | undefined {
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

  save(item: TieredComplaintBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredComplaintBundle[] {
    return this.inner.list();
  }
}

export function newCachedTieredComplaintBundleStore(inner: TieredComplaintBundleStore, ttl: number, clockValue: clock.Clock): TieredComplaintBundleStore {
  return new CachedTieredComplaintBundleStore(
    inner,
    cache.newTtlCache<TieredComplaintBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered complaint bundles. Empty fields match all. */
export class TieredComplaintBundleQuery {
  channel: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minAmount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredComplaintBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredComplaintBundle[]): TieredComplaintBundle[] {
    const matched = collections.filter(items, (candidate: TieredComplaintBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredComplaintBundles(store: TieredComplaintBundleStore, query: TieredComplaintBundleQuery): TieredComplaintBundle[] {
  return query.apply(store.list());
}
