import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionPreference } from "./subscription-preference.js";

/** Keeps subscription preferences by code. */
export interface SubscriptionPreferenceStore {
  find(code: string): SubscriptionPreference | undefined;
  save(item: SubscriptionPreference): void;
  remove(code: string): boolean;
  list(): SubscriptionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionPreferenceStore implements SubscriptionPreferenceStore {
  items: Map<string, SubscriptionPreference>;
  order: string[];

  constructor(items: Map<string, SubscriptionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionPreference): void {
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

  list(): SubscriptionPreference[] {
    const out: SubscriptionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionPreferenceStore(): SubscriptionPreferenceStore {
  return new MemorySubscriptionPreferenceStore(new Map<string, SubscriptionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionPreferenceStore implements SubscriptionPreferenceStore {
  inner: SubscriptionPreferenceStore;
  cache: cache.TtlCache<SubscriptionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionPreferenceStore,
    cacheValue: cache.TtlCache<SubscriptionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionPreference | undefined {
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

  save(item: SubscriptionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionPreference[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionPreferenceStore(inner: SubscriptionPreferenceStore, ttl: number, clockValue: clock.Clock): SubscriptionPreferenceStore {
  return new CachedSubscriptionPreferenceStore(
    inner,
    cache.newTtlCache<SubscriptionPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription preferences. Empty fields match all. */
export class SubscriptionPreferenceQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionPreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionPreference[]): SubscriptionPreference[] {
    const matched = collections.filter(items, (candidate: SubscriptionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionPreferences(store: SubscriptionPreferenceStore, query: SubscriptionPreferenceQuery): SubscriptionPreference[] {
  return query.apply(store.list());
}
