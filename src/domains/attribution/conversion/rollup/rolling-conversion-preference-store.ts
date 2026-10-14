import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingConversionPreference } from "./rolling-conversion-preference.js";

/** Keeps rolling conversion preferences by code. */
export interface RollingConversionPreferenceStore {
  find(code: string): RollingConversionPreference | undefined;
  save(item: RollingConversionPreference): void;
  remove(code: string): boolean;
  list(): RollingConversionPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingConversionPreferenceStore implements RollingConversionPreferenceStore {
  items: Map<string, RollingConversionPreference>;
  order: string[];

  constructor(items: Map<string, RollingConversionPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingConversionPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingConversionPreference): void {
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

  list(): RollingConversionPreference[] {
    const out: RollingConversionPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingConversionPreferenceStore(): RollingConversionPreferenceStore {
  return new MemoryRollingConversionPreferenceStore(new Map<string, RollingConversionPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingConversionPreferenceStore implements RollingConversionPreferenceStore {
  inner: RollingConversionPreferenceStore;
  cache: cache.TtlCache<RollingConversionPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingConversionPreferenceStore,
    cacheValue: cache.TtlCache<RollingConversionPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingConversionPreference | undefined {
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

  save(item: RollingConversionPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingConversionPreference[] {
    return this.inner.list();
  }
}

export function newCachedRollingConversionPreferenceStore(inner: RollingConversionPreferenceStore, ttl: number, clockValue: clock.Clock): RollingConversionPreferenceStore {
  return new CachedRollingConversionPreferenceStore(
    inner,
    cache.newTtlCache<RollingConversionPreference>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling conversion preferences. Empty fields match all. */
export class RollingConversionPreferenceQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingConversionPreference): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingConversionPreference[]): RollingConversionPreference[] {
    const matched = collections.filter(items, (candidate: RollingConversionPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingConversionPreferences(store: RollingConversionPreferenceStore, query: RollingConversionPreferenceQuery): RollingConversionPreference[] {
  return query.apply(store.list());
}
