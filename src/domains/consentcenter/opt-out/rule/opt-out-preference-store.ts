import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutPreference } from "./opt-out-preference.js";

/** Keeps opt out preferences by code. */
export interface OptOutPreferenceStore {
  find(code: string): OptOutPreference | undefined;
  save(item: OptOutPreference): void;
  remove(code: string): boolean;
  list(): OptOutPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutPreferenceStore implements OptOutPreferenceStore {
  items: Map<string, OptOutPreference>;
  order: string[];

  constructor(items: Map<string, OptOutPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutPreference): void {
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

  list(): OptOutPreference[] {
    const out: OptOutPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutPreferenceStore(): OptOutPreferenceStore {
  return new MemoryOptOutPreferenceStore(new Map<string, OptOutPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutPreferenceStore implements OptOutPreferenceStore {
  inner: OptOutPreferenceStore;
  cache: cache.TtlCache<OptOutPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutPreferenceStore,
    cacheValue: cache.TtlCache<OptOutPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutPreference | undefined {
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

  save(item: OptOutPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutPreference[] {
    return this.inner.list();
  }
}

export function newCachedOptOutPreferenceStore(inner: OptOutPreferenceStore, ttl: number, clockValue: clock.Clock): OptOutPreferenceStore {
  return new CachedOptOutPreferenceStore(inner, cache.newTtlCache<OptOutPreference>(64, ttl, clockValue), 0, 0);
}

/** Selects opt out preferences. Empty fields match all. */
export class OptOutPreferenceQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutPreference[]): OptOutPreference[] {
    const matched = collections.filter(items, (candidate: OptOutPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutPreferences(store: OptOutPreferenceStore, query: OptOutPreferenceQuery): OptOutPreference[] {
  return query.apply(store.list());
}
