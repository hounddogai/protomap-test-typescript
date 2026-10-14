import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

/** Keeps fallback bid rule preferences by code. */
export interface FallbackBidRulePreferenceStore {
  find(code: string): FallbackBidRulePreference | undefined;
  save(item: FallbackBidRulePreference): void;
  remove(code: string): boolean;
  list(): FallbackBidRulePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackBidRulePreferenceStore implements FallbackBidRulePreferenceStore {
  items: Map<string, FallbackBidRulePreference>;
  order: string[];

  constructor(items: Map<string, FallbackBidRulePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackBidRulePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackBidRulePreference): void {
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

  list(): FallbackBidRulePreference[] {
    const out: FallbackBidRulePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackBidRulePreferenceStore(): FallbackBidRulePreferenceStore {
  return new MemoryFallbackBidRulePreferenceStore(new Map<string, FallbackBidRulePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackBidRulePreferenceStore implements FallbackBidRulePreferenceStore {
  inner: FallbackBidRulePreferenceStore;
  cache: cache.TtlCache<FallbackBidRulePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackBidRulePreferenceStore,
    cacheValue: cache.TtlCache<FallbackBidRulePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackBidRulePreference | undefined {
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

  save(item: FallbackBidRulePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackBidRulePreference[] {
    return this.inner.list();
  }
}

export function newCachedFallbackBidRulePreferenceStore(inner: FallbackBidRulePreferenceStore, ttl: number, clockValue: clock.Clock): FallbackBidRulePreferenceStore {
  return new CachedFallbackBidRulePreferenceStore(
    inner,
    cache.newTtlCache<FallbackBidRulePreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback bid rule preferences. Empty fields match all. */
export class FallbackBidRulePreferenceQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackBidRulePreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackBidRulePreference[]): FallbackBidRulePreference[] {
    const matched = collections.filter(items, (candidate: FallbackBidRulePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackBidRulePreferences(store: FallbackBidRulePreferenceStore, query: FallbackBidRulePreferenceQuery): FallbackBidRulePreference[] {
  return query.apply(store.list());
}
