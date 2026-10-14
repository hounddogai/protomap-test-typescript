import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BidRulePreference } from "./bid-rule-preference.js";

/** Keeps bid rule preferences by code. */
export interface BidRulePreferenceStore {
  find(code: string): BidRulePreference | undefined;
  save(item: BidRulePreference): void;
  remove(code: string): boolean;
  list(): BidRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBidRulePreferenceStore implements BidRulePreferenceStore {
  items: Map<string, BidRulePreference>;
  order: string[];

  constructor(items: Map<string, BidRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BidRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BidRulePreference): void {
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

  list(): BidRulePreference[] {
    const out: BidRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBidRulePreferenceStore(): BidRulePreferenceStore {
  return new MemoryBidRulePreferenceStore(new Map<string, BidRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBidRulePreferenceStore implements BidRulePreferenceStore {
  inner: BidRulePreferenceStore;
  cache: cache.TtlCache<BidRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: BidRulePreferenceStore,
    cacheValue: cache.TtlCache<BidRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BidRulePreference | undefined {
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

  save(item: BidRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BidRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedBidRulePreferenceStore(inner: BidRulePreferenceStore, ttl: number, clockValue: clock.Clock): BidRulePreferenceStore {
  return new CachedBidRulePreferenceStore(inner, cache.newTtlCache<BidRulePreference>(1024, ttl, clockValue), 0, 0);
}

/** Selects bid rule preferences. Empty fields match all. */
export class BidRulePreferenceQuery {
  category: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAttempts: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BidRulePreference): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BidRulePreference[]): BidRulePreference[] {
    const matched = collections.filter(items, (candidate: BidRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBidRulePreferences(store: BidRulePreferenceStore, query: BidRulePreferenceQuery): BidRulePreference[] {
  return query.apply(store.list());
}
