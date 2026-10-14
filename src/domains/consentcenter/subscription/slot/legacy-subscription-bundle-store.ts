import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

/** Keeps legacy subscription bundles by code. */
export interface LegacySubscriptionBundleStore {
  find(code: string): LegacySubscriptionBundle | undefined;
  save(item: LegacySubscriptionBundle): void;
  remove(code: string): boolean;
  list(): LegacySubscriptionBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacySubscriptionBundleStore implements LegacySubscriptionBundleStore {
  items: Map<string, LegacySubscriptionBundle>;
  order: string[];

  constructor(items: Map<string, LegacySubscriptionBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacySubscriptionBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacySubscriptionBundle): void {
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

  list(): LegacySubscriptionBundle[] {
    const out: LegacySubscriptionBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacySubscriptionBundleStore(): LegacySubscriptionBundleStore {
  return new MemoryLegacySubscriptionBundleStore(new Map<string, LegacySubscriptionBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacySubscriptionBundleStore implements LegacySubscriptionBundleStore {
  inner: LegacySubscriptionBundleStore;
  cache: cache.TtlCache<LegacySubscriptionBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacySubscriptionBundleStore,
    cacheValue: cache.TtlCache<LegacySubscriptionBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacySubscriptionBundle | undefined {
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

  save(item: LegacySubscriptionBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacySubscriptionBundle[] {
    return this.inner.list();
  }
}

export function newCachedLegacySubscriptionBundleStore(inner: LegacySubscriptionBundleStore, ttl: number, clockValue: clock.Clock): LegacySubscriptionBundleStore {
  return new CachedLegacySubscriptionBundleStore(
    inner,
    cache.newTtlCache<LegacySubscriptionBundle>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy subscription bundles. Empty fields match all. */
export class LegacySubscriptionBundleQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacySubscriptionBundle): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacySubscriptionBundle[]): LegacySubscriptionBundle[] {
    const matched = collections.filter(items, (candidate: LegacySubscriptionBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacySubscriptionBundles(store: LegacySubscriptionBundleStore, query: LegacySubscriptionBundleQuery): LegacySubscriptionBundle[] {
  return query.apply(store.list());
}
