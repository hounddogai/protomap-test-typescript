import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackInvitePreference } from "./fallback-invite-preference.js";

/** Keeps fallback invite preferences by code. */
export interface FallbackInvitePreferenceStore {
  find(code: string): FallbackInvitePreference | undefined;
  save(item: FallbackInvitePreference): void;
  remove(code: string): boolean;
  list(): FallbackInvitePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackInvitePreferenceStore implements FallbackInvitePreferenceStore {
  items: Map<string, FallbackInvitePreference>;
  order: string[];

  constructor(items: Map<string, FallbackInvitePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackInvitePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackInvitePreference): void {
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

  list(): FallbackInvitePreference[] {
    const out: FallbackInvitePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackInvitePreferenceStore(): FallbackInvitePreferenceStore {
  return new MemoryFallbackInvitePreferenceStore(new Map<string, FallbackInvitePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackInvitePreferenceStore implements FallbackInvitePreferenceStore {
  inner: FallbackInvitePreferenceStore;
  cache: cache.TtlCache<FallbackInvitePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackInvitePreferenceStore,
    cacheValue: cache.TtlCache<FallbackInvitePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackInvitePreference | undefined {
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

  save(item: FallbackInvitePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackInvitePreference[] {
    return this.inner.list();
  }
}

export function newCachedFallbackInvitePreferenceStore(inner: FallbackInvitePreferenceStore, ttl: number, clockValue: clock.Clock): FallbackInvitePreferenceStore {
  return new CachedFallbackInvitePreferenceStore(
    inner,
    cache.newTtlCache<FallbackInvitePreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback invite preferences. Empty fields match all. */
export class FallbackInvitePreferenceQuery {
  segment: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAmount: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackInvitePreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackInvitePreference[]): FallbackInvitePreference[] {
    const matched = collections.filter(items, (candidate: FallbackInvitePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackInvitePreferences(store: FallbackInvitePreferenceStore, query: FallbackInvitePreferenceQuery): FallbackInvitePreference[] {
  return query.apply(store.list());
}
