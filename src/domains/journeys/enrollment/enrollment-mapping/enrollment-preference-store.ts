import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentPreference } from "./enrollment-preference.js";

/** Keeps enrollment preferences by code. */
export interface EnrollmentPreferenceStore {
  find(code: string): EnrollmentPreference | undefined;
  save(item: EnrollmentPreference): void;
  remove(code: string): boolean;
  list(): EnrollmentPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentPreferenceStore implements EnrollmentPreferenceStore {
  items: Map<string, EnrollmentPreference>;
  order: string[];

  constructor(items: Map<string, EnrollmentPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentPreference): void {
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

  list(): EnrollmentPreference[] {
    const out: EnrollmentPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentPreferenceStore(): EnrollmentPreferenceStore {
  return new MemoryEnrollmentPreferenceStore(new Map<string, EnrollmentPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentPreferenceStore implements EnrollmentPreferenceStore {
  inner: EnrollmentPreferenceStore;
  cache: cache.TtlCache<EnrollmentPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentPreferenceStore,
    cacheValue: cache.TtlCache<EnrollmentPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentPreference | undefined {
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

  save(item: EnrollmentPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentPreference[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentPreferenceStore(inner: EnrollmentPreferenceStore, ttl: number, clockValue: clock.Clock): EnrollmentPreferenceStore {
  return new CachedEnrollmentPreferenceStore(
    inner,
    cache.newTtlCache<EnrollmentPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects enrollment preferences. Empty fields match all. */
export class EnrollmentPreferenceQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentPreference[]): EnrollmentPreference[] {
    const matched = collections.filter(items, (candidate: EnrollmentPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentPreferences(store: EnrollmentPreferenceStore, query: EnrollmentPreferenceQuery): EnrollmentPreference[] {
  return query.apply(store.list());
}
