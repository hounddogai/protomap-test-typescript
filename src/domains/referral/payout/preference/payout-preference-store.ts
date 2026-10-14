import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutPreference } from "./payout-preference.js";

/** Keeps payout preferences by code. */
export interface PayoutPreferenceStore {
  find(code: string): PayoutPreference | undefined;
  save(item: PayoutPreference): void;
  remove(code: string): boolean;
  list(): PayoutPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutPreferenceStore implements PayoutPreferenceStore {
  items: Map<string, PayoutPreference>;
  order: string[];

  constructor(items: Map<string, PayoutPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutPreference): void {
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

  list(): PayoutPreference[] {
    const out: PayoutPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutPreferenceStore(): PayoutPreferenceStore {
  return new MemoryPayoutPreferenceStore(new Map<string, PayoutPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutPreferenceStore implements PayoutPreferenceStore {
  inner: PayoutPreferenceStore;
  cache: cache.TtlCache<PayoutPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutPreferenceStore,
    cacheValue: cache.TtlCache<PayoutPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutPreference | undefined {
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

  save(item: PayoutPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutPreference[] {
    return this.inner.list();
  }
}

export function newCachedPayoutPreferenceStore(inner: PayoutPreferenceStore, ttl: number, clockValue: clock.Clock): PayoutPreferenceStore {
  return new CachedPayoutPreferenceStore(inner, cache.newTtlCache<PayoutPreference>(512, ttl, clockValue), 0, 0);
}

/** Selects payout preferences. Empty fields match all. */
export class PayoutPreferenceQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutPreference[]): PayoutPreference[] {
    const matched = collections.filter(items, (candidate: PayoutPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutPreferences(store: PayoutPreferenceStore, query: PayoutPreferenceQuery): PayoutPreference[] {
  return query.apply(store.list());
}
