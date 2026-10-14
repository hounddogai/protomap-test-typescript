import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackLevelPreference } from "./fallback-level-preference.js";

/** Keeps fallback level preferences by code. */
export interface FallbackLevelPreferenceStore {
  find(code: string): FallbackLevelPreference | undefined;
  save(item: FallbackLevelPreference): void;
  remove(code: string): boolean;
  list(): FallbackLevelPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackLevelPreferenceStore implements FallbackLevelPreferenceStore {
  items: Map<string, FallbackLevelPreference>;
  order: string[];

  constructor(items: Map<string, FallbackLevelPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackLevelPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackLevelPreference): void {
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

  list(): FallbackLevelPreference[] {
    const out: FallbackLevelPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackLevelPreferenceStore(): FallbackLevelPreferenceStore {
  return new MemoryFallbackLevelPreferenceStore(new Map<string, FallbackLevelPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackLevelPreferenceStore implements FallbackLevelPreferenceStore {
  inner: FallbackLevelPreferenceStore;
  cache: cache.TtlCache<FallbackLevelPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackLevelPreferenceStore,
    cacheValue: cache.TtlCache<FallbackLevelPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackLevelPreference | undefined {
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

  save(item: FallbackLevelPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackLevelPreference[] {
    return this.inner.list();
  }
}

export function newCachedFallbackLevelPreferenceStore(inner: FallbackLevelPreferenceStore, ttl: number, clockValue: clock.Clock): FallbackLevelPreferenceStore {
  return new CachedFallbackLevelPreferenceStore(
    inner,
    cache.newTtlCache<FallbackLevelPreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback level preferences. Empty fields match all. */
export class FallbackLevelPreferenceQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackLevelPreference): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackLevelPreference[]): FallbackLevelPreference[] {
    const matched = collections.filter(items, (candidate: FallbackLevelPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackLevelPreferences(store: FallbackLevelPreferenceStore, query: FallbackLevelPreferenceQuery): FallbackLevelPreference[] {
  return query.apply(store.list());
}
