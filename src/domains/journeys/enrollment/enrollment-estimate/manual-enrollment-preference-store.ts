import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualEnrollmentPreference } from "./manual-enrollment-preference.js";

/** Keeps manual enrollment preferences by code. */
export interface ManualEnrollmentPreferenceStore {
  find(code: string): ManualEnrollmentPreference | undefined;
  save(item: ManualEnrollmentPreference): void;
  remove(code: string): boolean;
  list(): ManualEnrollmentPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualEnrollmentPreferenceStore implements ManualEnrollmentPreferenceStore {
  items: Map<string, ManualEnrollmentPreference>;
  order: string[];

  constructor(items: Map<string, ManualEnrollmentPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualEnrollmentPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualEnrollmentPreference): void {
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

  list(): ManualEnrollmentPreference[] {
    const out: ManualEnrollmentPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualEnrollmentPreferenceStore(): ManualEnrollmentPreferenceStore {
  return new MemoryManualEnrollmentPreferenceStore(new Map<string, ManualEnrollmentPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualEnrollmentPreferenceStore implements ManualEnrollmentPreferenceStore {
  inner: ManualEnrollmentPreferenceStore;
  cache: cache.TtlCache<ManualEnrollmentPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualEnrollmentPreferenceStore,
    cacheValue: cache.TtlCache<ManualEnrollmentPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualEnrollmentPreference | undefined {
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

  save(item: ManualEnrollmentPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualEnrollmentPreference[] {
    return this.inner.list();
  }
}

export function newCachedManualEnrollmentPreferenceStore(inner: ManualEnrollmentPreferenceStore, ttl: number, clockValue: clock.Clock): ManualEnrollmentPreferenceStore {
  return new CachedManualEnrollmentPreferenceStore(
    inner,
    cache.newTtlCache<ManualEnrollmentPreference>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual enrollment preferences. Empty fields match all. */
export class ManualEnrollmentPreferenceQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualEnrollmentPreference): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualEnrollmentPreference[]): ManualEnrollmentPreference[] {
    const matched = collections.filter(items, (candidate: ManualEnrollmentPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualEnrollmentPreferences(store: ManualEnrollmentPreferenceStore, query: ManualEnrollmentPreferenceQuery): ManualEnrollmentPreference[] {
  return query.apply(store.list());
}
