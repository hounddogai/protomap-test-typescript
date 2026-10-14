import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckPreference } from "./fraud-check-preference.js";

/** Keeps fraud check preferences by code. */
export interface FraudCheckPreferenceStore {
  find(code: string): FraudCheckPreference | undefined;
  save(item: FraudCheckPreference): void;
  remove(code: string): boolean;
  list(): FraudCheckPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckPreferenceStore implements FraudCheckPreferenceStore {
  items: Map<string, FraudCheckPreference>;
  order: string[];

  constructor(items: Map<string, FraudCheckPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckPreference): void {
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

  list(): FraudCheckPreference[] {
    const out: FraudCheckPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckPreferenceStore(): FraudCheckPreferenceStore {
  return new MemoryFraudCheckPreferenceStore(new Map<string, FraudCheckPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckPreferenceStore implements FraudCheckPreferenceStore {
  inner: FraudCheckPreferenceStore;
  cache: cache.TtlCache<FraudCheckPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckPreferenceStore,
    cacheValue: cache.TtlCache<FraudCheckPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckPreference | undefined {
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

  save(item: FraudCheckPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckPreference[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckPreferenceStore(inner: FraudCheckPreferenceStore, ttl: number, clockValue: clock.Clock): FraudCheckPreferenceStore {
  return new CachedFraudCheckPreferenceStore(
    inner,
    cache.newTtlCache<FraudCheckPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fraud check preferences. Empty fields match all. */
export class FraudCheckPreferenceQuery {
  segment: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckPreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckPreference[]): FraudCheckPreference[] {
    const matched = collections.filter(items, (candidate: FraudCheckPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckPreferences(store: FraudCheckPreferenceStore, query: FraudCheckPreferenceQuery): FraudCheckPreference[] {
  return query.apply(store.list());
}
