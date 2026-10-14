import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBidRulePreference } from "./lenient-bid-rule-preference.js";

/** Keeps lenient bid rule preferences by code. */
export interface LenientBidRulePreferenceStore {
  find(code: string): LenientBidRulePreference | undefined;
  save(item: LenientBidRulePreference): void;
  remove(code: string): boolean;
  list(): LenientBidRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBidRulePreferenceStore implements LenientBidRulePreferenceStore {
  items: Map<string, LenientBidRulePreference>;
  order: string[];

  constructor(items: Map<string, LenientBidRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBidRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBidRulePreference): void {
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

  list(): LenientBidRulePreference[] {
    const out: LenientBidRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBidRulePreferenceStore(): LenientBidRulePreferenceStore {
  return new MemoryLenientBidRulePreferenceStore(new Map<string, LenientBidRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBidRulePreferenceStore implements LenientBidRulePreferenceStore {
  inner: LenientBidRulePreferenceStore;
  cache: cache.TtlCache<LenientBidRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBidRulePreferenceStore,
    cacheValue: cache.TtlCache<LenientBidRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBidRulePreference | undefined {
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

  save(item: LenientBidRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBidRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedLenientBidRulePreferenceStore(inner: LenientBidRulePreferenceStore, ttl: number, clockValue: clock.Clock): LenientBidRulePreferenceStore {
  return new CachedLenientBidRulePreferenceStore(
    inner,
    cache.newTtlCache<LenientBidRulePreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient bid rule preferences. Empty fields match all. */
export class LenientBidRulePreferenceQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBidRulePreference): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBidRulePreference[]): LenientBidRulePreference[] {
    const matched = collections.filter(items, (candidate: LenientBidRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBidRulePreferences(store: LenientBidRulePreferenceStore, query: LenientBidRulePreferenceQuery): LenientBidRulePreference[] {
  return query.apply(store.list());
}
