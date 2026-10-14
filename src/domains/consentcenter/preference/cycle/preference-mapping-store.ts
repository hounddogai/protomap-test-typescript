import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PreferenceMapping } from "./preference-mapping.js";

/** Keeps preference mappings by code. */
export interface PreferenceMappingStore {
  find(code: string): PreferenceMapping | undefined;
  save(item: PreferenceMapping): void;
  remove(code: string): boolean;
  list(): PreferenceMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPreferenceMappingStore implements PreferenceMappingStore {
  items: Map<string, PreferenceMapping>;
  order: string[];

  constructor(items: Map<string, PreferenceMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PreferenceMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PreferenceMapping): void {
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

  list(): PreferenceMapping[] {
    const out: PreferenceMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPreferenceMappingStore(): PreferenceMappingStore {
  return new MemoryPreferenceMappingStore(new Map<string, PreferenceMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPreferenceMappingStore implements PreferenceMappingStore {
  inner: PreferenceMappingStore;
  cache: cache.TtlCache<PreferenceMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PreferenceMappingStore,
    cacheValue: cache.TtlCache<PreferenceMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PreferenceMapping | undefined {
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

  save(item: PreferenceMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PreferenceMapping[] {
    return this.inner.list();
  }
}

export function newCachedPreferenceMappingStore(inner: PreferenceMappingStore, ttl: number, clockValue: clock.Clock): PreferenceMappingStore {
  return new CachedPreferenceMappingStore(inner, cache.newTtlCache<PreferenceMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects preference mappings. Empty fields match all. */
export class PreferenceMappingQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PreferenceMapping): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PreferenceMapping[]): PreferenceMapping[] {
    const matched = collections.filter(items, (candidate: PreferenceMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPreferenceMappings(store: PreferenceMappingStore, query: PreferenceMappingQuery): PreferenceMapping[] {
  return query.apply(store.list());
}
