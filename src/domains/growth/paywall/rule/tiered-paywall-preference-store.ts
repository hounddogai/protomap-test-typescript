import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPaywallPreference } from "./tiered-paywall-preference.js";

/** Keeps tiered paywall preferences by code. */
export interface TieredPaywallPreferenceStore {
  find(code: string): TieredPaywallPreference | undefined;
  save(item: TieredPaywallPreference): void;
  remove(code: string): boolean;
  list(): TieredPaywallPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPaywallPreferenceStore implements TieredPaywallPreferenceStore {
  items: Map<string, TieredPaywallPreference>;
  order: string[];

  constructor(items: Map<string, TieredPaywallPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPaywallPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPaywallPreference): void {
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

  list(): TieredPaywallPreference[] {
    const out: TieredPaywallPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPaywallPreferenceStore(): TieredPaywallPreferenceStore {
  return new MemoryTieredPaywallPreferenceStore(new Map<string, TieredPaywallPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPaywallPreferenceStore implements TieredPaywallPreferenceStore {
  inner: TieredPaywallPreferenceStore;
  cache: cache.TtlCache<TieredPaywallPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPaywallPreferenceStore,
    cacheValue: cache.TtlCache<TieredPaywallPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPaywallPreference | undefined {
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

  save(item: TieredPaywallPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPaywallPreference[] {
    return this.inner.list();
  }
}

export function newCachedTieredPaywallPreferenceStore(inner: TieredPaywallPreferenceStore, ttl: number, clockValue: clock.Clock): TieredPaywallPreferenceStore {
  return new CachedTieredPaywallPreferenceStore(
    inner,
    cache.newTtlCache<TieredPaywallPreference>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered paywall preferences. Empty fields match all. */
export class TieredPaywallPreferenceQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPaywallPreference): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPaywallPreference[]): TieredPaywallPreference[] {
    const matched = collections.filter(items, (candidate: TieredPaywallPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPaywallPreferences(store: TieredPaywallPreferenceStore, query: TieredPaywallPreferenceQuery): TieredPaywallPreference[] {
  return query.apply(store.list());
}
