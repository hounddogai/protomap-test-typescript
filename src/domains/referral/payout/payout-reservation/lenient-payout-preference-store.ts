import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPayoutPreference } from "./lenient-payout-preference.js";

/** Keeps lenient payout preferences by code. */
export interface LenientPayoutPreferenceStore {
  find(code: string): LenientPayoutPreference | undefined;
  save(item: LenientPayoutPreference): void;
  remove(code: string): boolean;
  list(): LenientPayoutPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPayoutPreferenceStore implements LenientPayoutPreferenceStore {
  items: Map<string, LenientPayoutPreference>;
  order: string[];

  constructor(items: Map<string, LenientPayoutPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPayoutPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPayoutPreference): void {
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

  list(): LenientPayoutPreference[] {
    const out: LenientPayoutPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPayoutPreferenceStore(): LenientPayoutPreferenceStore {
  return new MemoryLenientPayoutPreferenceStore(new Map<string, LenientPayoutPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPayoutPreferenceStore implements LenientPayoutPreferenceStore {
  inner: LenientPayoutPreferenceStore;
  cache: cache.TtlCache<LenientPayoutPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPayoutPreferenceStore,
    cacheValue: cache.TtlCache<LenientPayoutPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPayoutPreference | undefined {
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

  save(item: LenientPayoutPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPayoutPreference[] {
    return this.inner.list();
  }
}

export function newCachedLenientPayoutPreferenceStore(inner: LenientPayoutPreferenceStore, ttl: number, clockValue: clock.Clock): LenientPayoutPreferenceStore {
  return new CachedLenientPayoutPreferenceStore(
    inner,
    cache.newTtlCache<LenientPayoutPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient payout preferences. Empty fields match all. */
export class LenientPayoutPreferenceQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPayoutPreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPayoutPreference[]): LenientPayoutPreference[] {
    const matched = collections.filter(items, (candidate: LenientPayoutPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPayoutPreferences(store: LenientPayoutPreferenceStore, query: LenientPayoutPreferenceQuery): LenientPayoutPreference[] {
  return query.apply(store.list());
}
