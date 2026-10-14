import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalRedemptionBundle } from "./global-redemption-bundle.js";

/** Keeps global redemption bundles by code. */
export interface GlobalRedemptionBundleStore {
  find(code: string): GlobalRedemptionBundle | undefined;
  save(item: GlobalRedemptionBundle): void;
  remove(code: string): boolean;
  list(): GlobalRedemptionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalRedemptionBundleStore implements GlobalRedemptionBundleStore {
  items: Map<string, GlobalRedemptionBundle>;
  order: string[];

  constructor(items: Map<string, GlobalRedemptionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalRedemptionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalRedemptionBundle): void {
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

  list(): GlobalRedemptionBundle[] {
    const out: GlobalRedemptionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalRedemptionBundleStore(): GlobalRedemptionBundleStore {
  return new MemoryGlobalRedemptionBundleStore(new Map<string, GlobalRedemptionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalRedemptionBundleStore implements GlobalRedemptionBundleStore {
  inner: GlobalRedemptionBundleStore;
  cache: cache.TtlCache<GlobalRedemptionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalRedemptionBundleStore,
    cacheValue: cache.TtlCache<GlobalRedemptionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalRedemptionBundle | undefined {
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

  save(item: GlobalRedemptionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalRedemptionBundle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalRedemptionBundleStore(inner: GlobalRedemptionBundleStore, ttl: number, clockValue: clock.Clock): GlobalRedemptionBundleStore {
  return new CachedGlobalRedemptionBundleStore(
    inner,
    cache.newTtlCache<GlobalRedemptionBundle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global redemption bundles. Empty fields match all. */
export class GlobalRedemptionBundleQuery {
  channel: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minStartsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalRedemptionBundle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalRedemptionBundle[]): GlobalRedemptionBundle[] {
    const matched = collections.filter(items, (candidate: GlobalRedemptionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalRedemptionBundles(store: GlobalRedemptionBundleStore, query: GlobalRedemptionBundleQuery): GlobalRedemptionBundle[] {
  return query.apply(store.list());
}
