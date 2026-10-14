import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

/** Keeps global fraud check preferences by code. */
export interface GlobalFraudCheckPreferenceStore {
  find(code: string): GlobalFraudCheckPreference | undefined;
  save(item: GlobalFraudCheckPreference): void;
  remove(code: string): boolean;
  list(): GlobalFraudCheckPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFraudCheckPreferenceStore implements GlobalFraudCheckPreferenceStore {
  items: Map<string, GlobalFraudCheckPreference>;
  order: string[];

  constructor(items: Map<string, GlobalFraudCheckPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFraudCheckPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFraudCheckPreference): void {
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

  list(): GlobalFraudCheckPreference[] {
    const out: GlobalFraudCheckPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFraudCheckPreferenceStore(): GlobalFraudCheckPreferenceStore {
  return new MemoryGlobalFraudCheckPreferenceStore(new Map<string, GlobalFraudCheckPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFraudCheckPreferenceStore implements GlobalFraudCheckPreferenceStore {
  inner: GlobalFraudCheckPreferenceStore;
  cache: cache.TtlCache<GlobalFraudCheckPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFraudCheckPreferenceStore,
    cacheValue: cache.TtlCache<GlobalFraudCheckPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFraudCheckPreference | undefined {
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

  save(item: GlobalFraudCheckPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFraudCheckPreference[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFraudCheckPreferenceStore(inner: GlobalFraudCheckPreferenceStore, ttl: number, clockValue: clock.Clock): GlobalFraudCheckPreferenceStore {
  return new CachedGlobalFraudCheckPreferenceStore(
    inner,
    cache.newTtlCache<GlobalFraudCheckPreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global fraud check preferences. Empty fields match all. */
export class GlobalFraudCheckPreferenceQuery {
  segment: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAmount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFraudCheckPreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFraudCheckPreference[]): GlobalFraudCheckPreference[] {
    const matched = collections.filter(items, (candidate: GlobalFraudCheckPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFraudCheckPreferences(store: GlobalFraudCheckPreferenceStore, query: GlobalFraudCheckPreferenceQuery): GlobalFraudCheckPreference[] {
  return query.apply(store.list());
}
