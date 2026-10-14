import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionPreference } from "./retention-preference.js";

/** Keeps retention preferences by code. */
export interface RetentionPreferenceStore {
  find(code: string): RetentionPreference | undefined;
  save(item: RetentionPreference): void;
  remove(code: string): boolean;
  list(): RetentionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionPreferenceStore implements RetentionPreferenceStore {
  items: Map<string, RetentionPreference>;
  order: string[];

  constructor(items: Map<string, RetentionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionPreference): void {
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

  list(): RetentionPreference[] {
    const out: RetentionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionPreferenceStore(): RetentionPreferenceStore {
  return new MemoryRetentionPreferenceStore(new Map<string, RetentionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionPreferenceStore implements RetentionPreferenceStore {
  inner: RetentionPreferenceStore;
  cache: cache.TtlCache<RetentionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionPreferenceStore,
    cacheValue: cache.TtlCache<RetentionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionPreference | undefined {
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

  save(item: RetentionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionPreference[] {
    return this.inner.list();
  }
}

export function newCachedRetentionPreferenceStore(inner: RetentionPreferenceStore, ttl: number, clockValue: clock.Clock): RetentionPreferenceStore {
  return new CachedRetentionPreferenceStore(inner, cache.newTtlCache<RetentionPreference>(64, ttl, clockValue), 0, 0);
}

/** Selects retention preferences. Empty fields match all. */
export class RetentionPreferenceQuery {
  unit: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionPreference): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionPreference[]): RetentionPreference[] {
    const matched = collections.filter(items, (candidate: RetentionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionPreferences(store: RetentionPreferenceStore, query: RetentionPreferenceQuery): RetentionPreference[] {
  return query.apply(store.list());
}
