import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientCreditPreference } from "./lenient-credit-preference.js";

/** Keeps lenient credit preferences by code. */
export interface LenientCreditPreferenceStore {
  find(code: string): LenientCreditPreference | undefined;
  save(item: LenientCreditPreference): void;
  remove(code: string): boolean;
  list(): LenientCreditPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientCreditPreferenceStore implements LenientCreditPreferenceStore {
  items: Map<string, LenientCreditPreference>;
  order: string[];

  constructor(items: Map<string, LenientCreditPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientCreditPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientCreditPreference): void {
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

  list(): LenientCreditPreference[] {
    const out: LenientCreditPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientCreditPreferenceStore(): LenientCreditPreferenceStore {
  return new MemoryLenientCreditPreferenceStore(new Map<string, LenientCreditPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientCreditPreferenceStore implements LenientCreditPreferenceStore {
  inner: LenientCreditPreferenceStore;
  cache: cache.TtlCache<LenientCreditPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientCreditPreferenceStore,
    cacheValue: cache.TtlCache<LenientCreditPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientCreditPreference | undefined {
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

  save(item: LenientCreditPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientCreditPreference[] {
    return this.inner.list();
  }
}

export function newCachedLenientCreditPreferenceStore(inner: LenientCreditPreferenceStore, ttl: number, clockValue: clock.Clock): LenientCreditPreferenceStore {
  return new CachedLenientCreditPreferenceStore(
    inner,
    cache.newTtlCache<LenientCreditPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient credit preferences. Empty fields match all. */
export class LenientCreditPreferenceQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientCreditPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientCreditPreference[]): LenientCreditPreference[] {
    const matched = collections.filter(items, (candidate: LenientCreditPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientCreditPreferences(store: LenientCreditPreferenceStore, query: LenientCreditPreferenceQuery): LenientCreditPreference[] {
  return query.apply(store.list());
}
