import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintPreference } from "./complaint-preference.js";

/** Keeps complaint preferences by code. */
export interface ComplaintPreferenceStore {
  find(code: string): ComplaintPreference | undefined;
  save(item: ComplaintPreference): void;
  remove(code: string): boolean;
  list(): ComplaintPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintPreferenceStore implements ComplaintPreferenceStore {
  items: Map<string, ComplaintPreference>;
  order: string[];

  constructor(items: Map<string, ComplaintPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintPreference): void {
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

  list(): ComplaintPreference[] {
    const out: ComplaintPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintPreferenceStore(): ComplaintPreferenceStore {
  return new MemoryComplaintPreferenceStore(new Map<string, ComplaintPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintPreferenceStore implements ComplaintPreferenceStore {
  inner: ComplaintPreferenceStore;
  cache: cache.TtlCache<ComplaintPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintPreferenceStore,
    cacheValue: cache.TtlCache<ComplaintPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintPreference | undefined {
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

  save(item: ComplaintPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintPreference[] {
    return this.inner.list();
  }
}

export function newCachedComplaintPreferenceStore(inner: ComplaintPreferenceStore, ttl: number, clockValue: clock.Clock): ComplaintPreferenceStore {
  return new CachedComplaintPreferenceStore(inner, cache.newTtlCache<ComplaintPreference>(512, ttl, clockValue), 0, 0);
}

/** Selects complaint preferences. Empty fields match all. */
export class ComplaintPreferenceQuery {
  segment: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRate: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintPreference): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintPreference[]): ComplaintPreference[] {
    const matched = collections.filter(items, (candidate: ComplaintPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintPreferences(store: ComplaintPreferenceStore, query: ComplaintPreferenceQuery): ComplaintPreference[] {
  return query.apply(store.list());
}
