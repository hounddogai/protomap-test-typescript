import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCreditPreference } from "./fallback-credit-preference.js";

/** Keeps fallback credit preferences by code. */
export interface FallbackCreditPreferenceStore {
  find(code: string): FallbackCreditPreference | undefined;
  save(item: FallbackCreditPreference): void;
  remove(code: string): boolean;
  list(): FallbackCreditPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCreditPreferenceStore implements FallbackCreditPreferenceStore {
  items: Map<string, FallbackCreditPreference>;
  order: string[];

  constructor(items: Map<string, FallbackCreditPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCreditPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCreditPreference): void {
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

  list(): FallbackCreditPreference[] {
    const out: FallbackCreditPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCreditPreferenceStore(): FallbackCreditPreferenceStore {
  return new MemoryFallbackCreditPreferenceStore(new Map<string, FallbackCreditPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCreditPreferenceStore implements FallbackCreditPreferenceStore {
  inner: FallbackCreditPreferenceStore;
  cache: cache.TtlCache<FallbackCreditPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCreditPreferenceStore,
    cacheValue: cache.TtlCache<FallbackCreditPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCreditPreference | undefined {
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

  save(item: FallbackCreditPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCreditPreference[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCreditPreferenceStore(inner: FallbackCreditPreferenceStore, ttl: number, clockValue: clock.Clock): FallbackCreditPreferenceStore {
  return new CachedFallbackCreditPreferenceStore(
    inner,
    cache.newTtlCache<FallbackCreditPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback credit preferences. Empty fields match all. */
export class FallbackCreditPreferenceQuery {
  unit: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRevision: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCreditPreference): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCreditPreference[]): FallbackCreditPreference[] {
    const matched = collections.filter(items, (candidate: FallbackCreditPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCreditPreferences(store: FallbackCreditPreferenceStore, query: FallbackCreditPreferenceQuery): FallbackCreditPreference[] {
  return query.apply(store.list());
}
