import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortPreference } from "./cohort-preference.js";

/** Keeps cohort preferences by code. */
export interface CohortPreferenceStore {
  find(code: string): CohortPreference | undefined;
  save(item: CohortPreference): void;
  remove(code: string): boolean;
  list(): CohortPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortPreferenceStore implements CohortPreferenceStore {
  items: Map<string, CohortPreference>;
  order: string[];

  constructor(items: Map<string, CohortPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortPreference): void {
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

  list(): CohortPreference[] {
    const out: CohortPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortPreferenceStore(): CohortPreferenceStore {
  return new MemoryCohortPreferenceStore(new Map<string, CohortPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortPreferenceStore implements CohortPreferenceStore {
  inner: CohortPreferenceStore;
  cache: cache.TtlCache<CohortPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortPreferenceStore,
    cacheValue: cache.TtlCache<CohortPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortPreference | undefined {
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

  save(item: CohortPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortPreference[] {
    return this.inner.list();
  }
}

export function newCachedCohortPreferenceStore(inner: CohortPreferenceStore, ttl: number, clockValue: clock.Clock): CohortPreferenceStore {
  return new CachedCohortPreferenceStore(inner, cache.newTtlCache<CohortPreference>(1024, ttl, clockValue), 0, 0);
}

/** Selects cohort preferences. Empty fields match all. */
export class CohortPreferenceQuery {
  title: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minWeight: number, statuses: string[], limit: number) {
    this.title = title;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortPreference[]): CohortPreference[] {
    const matched = collections.filter(items, (candidate: CohortPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortPreferences(store: CohortPreferenceStore, query: CohortPreferenceQuery): CohortPreference[] {
  return query.apply(store.list());
}
