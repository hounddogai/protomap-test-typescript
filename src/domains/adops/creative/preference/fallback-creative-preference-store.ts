import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCreativePreference } from "./fallback-creative-preference.js";

/** Keeps fallback creative preferences by code. */
export interface FallbackCreativePreferenceStore {
  find(code: string): FallbackCreativePreference | undefined;
  save(item: FallbackCreativePreference): void;
  remove(code: string): boolean;
  list(): FallbackCreativePreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCreativePreferenceStore implements FallbackCreativePreferenceStore {
  items: Map<string, FallbackCreativePreference>;
  order: string[];

  constructor(items: Map<string, FallbackCreativePreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCreativePreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCreativePreference): void {
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

  list(): FallbackCreativePreference[] {
    const out: FallbackCreativePreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCreativePreferenceStore(): FallbackCreativePreferenceStore {
  return new MemoryFallbackCreativePreferenceStore(new Map<string, FallbackCreativePreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCreativePreferenceStore implements FallbackCreativePreferenceStore {
  inner: FallbackCreativePreferenceStore;
  cache: cache.TtlCache<FallbackCreativePreference>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCreativePreferenceStore,
    cacheValue: cache.TtlCache<FallbackCreativePreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCreativePreference | undefined {
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

  save(item: FallbackCreativePreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCreativePreference[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCreativePreferenceStore(inner: FallbackCreativePreferenceStore, ttl: number, clockValue: clock.Clock): FallbackCreativePreferenceStore {
  return new CachedFallbackCreativePreferenceStore(
    inner,
    cache.newTtlCache<FallbackCreativePreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback creative preferences. Empty fields match all. */
export class FallbackCreativePreferenceQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCreativePreference): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCreativePreference[]): FallbackCreativePreference[] {
    const matched = collections.filter(items, (candidate: FallbackCreativePreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCreativePreferences(store: FallbackCreativePreferenceStore, query: FallbackCreativePreferenceQuery): FallbackCreativePreference[] {
  return query.apply(store.list());
}
