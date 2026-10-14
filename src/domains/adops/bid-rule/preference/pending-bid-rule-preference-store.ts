import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBidRulePreference } from "./pending-bid-rule-preference.js";

/** Keeps pending bid rule preferences by code. */
export interface PendingBidRulePreferenceStore {
  find(code: string): PendingBidRulePreference | undefined;
  save(item: PendingBidRulePreference): void;
  remove(code: string): boolean;
  list(): PendingBidRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBidRulePreferenceStore implements PendingBidRulePreferenceStore {
  items: Map<string, PendingBidRulePreference>;
  order: string[];

  constructor(items: Map<string, PendingBidRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBidRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBidRulePreference): void {
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

  list(): PendingBidRulePreference[] {
    const out: PendingBidRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBidRulePreferenceStore(): PendingBidRulePreferenceStore {
  return new MemoryPendingBidRulePreferenceStore(new Map<string, PendingBidRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBidRulePreferenceStore implements PendingBidRulePreferenceStore {
  inner: PendingBidRulePreferenceStore;
  cache: cache.TtlCache<PendingBidRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBidRulePreferenceStore,
    cacheValue: cache.TtlCache<PendingBidRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBidRulePreference | undefined {
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

  save(item: PendingBidRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBidRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedPendingBidRulePreferenceStore(inner: PendingBidRulePreferenceStore, ttl: number, clockValue: clock.Clock): PendingBidRulePreferenceStore {
  return new CachedPendingBidRulePreferenceStore(
    inner,
    cache.newTtlCache<PendingBidRulePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending bid rule preferences. Empty fields match all. */
export class PendingBidRulePreferenceQuery {
  utmSource: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minQuantity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBidRulePreference): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBidRulePreference[]): PendingBidRulePreference[] {
    const matched = collections.filter(items, (candidate: PendingBidRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBidRulePreferences(store: PendingBidRulePreferenceStore, query: PendingBidRulePreferenceQuery): PendingBidRulePreference[] {
  return query.apply(store.list());
}
