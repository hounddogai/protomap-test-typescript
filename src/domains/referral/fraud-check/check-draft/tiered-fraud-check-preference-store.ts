import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

/** Keeps tiered fraud check preferences by code. */
export interface TieredFraudCheckPreferenceStore {
  find(code: string): TieredFraudCheckPreference | undefined;
  save(item: TieredFraudCheckPreference): void;
  remove(code: string): boolean;
  list(): TieredFraudCheckPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFraudCheckPreferenceStore implements TieredFraudCheckPreferenceStore {
  items: Map<string, TieredFraudCheckPreference>;
  order: string[];

  constructor(items: Map<string, TieredFraudCheckPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFraudCheckPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFraudCheckPreference): void {
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

  list(): TieredFraudCheckPreference[] {
    const out: TieredFraudCheckPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFraudCheckPreferenceStore(): TieredFraudCheckPreferenceStore {
  return new MemoryTieredFraudCheckPreferenceStore(new Map<string, TieredFraudCheckPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFraudCheckPreferenceStore implements TieredFraudCheckPreferenceStore {
  inner: TieredFraudCheckPreferenceStore;
  cache: cache.TtlCache<TieredFraudCheckPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFraudCheckPreferenceStore,
    cacheValue: cache.TtlCache<TieredFraudCheckPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFraudCheckPreference | undefined {
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

  save(item: TieredFraudCheckPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFraudCheckPreference[] {
    return this.inner.list();
  }
}

export function newCachedTieredFraudCheckPreferenceStore(inner: TieredFraudCheckPreferenceStore, ttl: number, clockValue: clock.Clock): TieredFraudCheckPreferenceStore {
  return new CachedTieredFraudCheckPreferenceStore(
    inner,
    cache.newTtlCache<TieredFraudCheckPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered fraud check preferences. Empty fields match all. */
export class TieredFraudCheckPreferenceQuery {
  country: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minSendAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFraudCheckPreference): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFraudCheckPreference[]): TieredFraudCheckPreference[] {
    const matched = collections.filter(items, (candidate: TieredFraudCheckPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFraudCheckPreferences(store: TieredFraudCheckPreferenceStore, query: TieredFraudCheckPreferenceQuery): TieredFraudCheckPreference[] {
  return query.apply(store.list());
}
