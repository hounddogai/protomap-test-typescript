import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallPreference } from "./paywall-preference.js";

/** Keeps paywall preferences by code. */
export interface PaywallPreferenceStore {
  find(code: string): PaywallPreference | undefined;
  save(item: PaywallPreference): void;
  remove(code: string): boolean;
  list(): PaywallPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallPreferenceStore implements PaywallPreferenceStore {
  items: Map<string, PaywallPreference>;
  order: string[];

  constructor(items: Map<string, PaywallPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallPreference): void {
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

  list(): PaywallPreference[] {
    const out: PaywallPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallPreferenceStore(): PaywallPreferenceStore {
  return new MemoryPaywallPreferenceStore(new Map<string, PaywallPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallPreferenceStore implements PaywallPreferenceStore {
  inner: PaywallPreferenceStore;
  cache: cache.TtlCache<PaywallPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallPreferenceStore,
    cacheValue: cache.TtlCache<PaywallPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallPreference | undefined {
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

  save(item: PaywallPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallPreference[] {
    return this.inner.list();
  }
}

export function newCachedPaywallPreferenceStore(inner: PaywallPreferenceStore, ttl: number, clockValue: clock.Clock): PaywallPreferenceStore {
  return new CachedPaywallPreferenceStore(inner, cache.newTtlCache<PaywallPreference>(256, ttl, clockValue), 0, 0);
}

/** Selects paywall preferences. Empty fields match all. */
export class PaywallPreferenceQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallPreference): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallPreference[]): PaywallPreference[] {
    const matched = collections.filter(items, (candidate: PaywallPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallPreferences(store: PaywallPreferenceStore, query: PaywallPreferenceQuery): PaywallPreference[] {
  return query.apply(store.list());
}
