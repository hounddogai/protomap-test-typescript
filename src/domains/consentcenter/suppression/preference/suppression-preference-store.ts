import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionPreference } from "./suppression-preference.js";

/** Keeps suppression preferences by code. */
export interface SuppressionPreferenceStore {
  find(code: string): SuppressionPreference | undefined;
  save(item: SuppressionPreference): void;
  remove(code: string): boolean;
  list(): SuppressionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionPreferenceStore implements SuppressionPreferenceStore {
  items: Map<string, SuppressionPreference>;
  order: string[];

  constructor(items: Map<string, SuppressionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionPreference): void {
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

  list(): SuppressionPreference[] {
    const out: SuppressionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionPreferenceStore(): SuppressionPreferenceStore {
  return new MemorySuppressionPreferenceStore(new Map<string, SuppressionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionPreferenceStore implements SuppressionPreferenceStore {
  inner: SuppressionPreferenceStore;
  cache: cache.TtlCache<SuppressionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionPreferenceStore,
    cacheValue: cache.TtlCache<SuppressionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionPreference | undefined {
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

  save(item: SuppressionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionPreference[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionPreferenceStore(inner: SuppressionPreferenceStore, ttl: number, clockValue: clock.Clock): SuppressionPreferenceStore {
  return new CachedSuppressionPreferenceStore(
    inner,
    cache.newTtlCache<SuppressionPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects suppression preferences. Empty fields match all. */
export class SuppressionPreferenceQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionPreference): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionPreference[]): SuppressionPreference[] {
    const matched = collections.filter(items, (candidate: SuppressionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionPreferences(store: SuppressionPreferenceStore, query: SuppressionPreferenceQuery): SuppressionPreference[] {
  return query.apply(store.list());
}
