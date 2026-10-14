import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointPreference } from "./touchpoint-preference.js";

/** Keeps touchpoint preferences by code. */
export interface TouchpointPreferenceStore {
  find(code: string): TouchpointPreference | undefined;
  save(item: TouchpointPreference): void;
  remove(code: string): boolean;
  list(): TouchpointPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointPreferenceStore implements TouchpointPreferenceStore {
  items: Map<string, TouchpointPreference>;
  order: string[];

  constructor(items: Map<string, TouchpointPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointPreference): void {
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

  list(): TouchpointPreference[] {
    const out: TouchpointPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointPreferenceStore(): TouchpointPreferenceStore {
  return new MemoryTouchpointPreferenceStore(new Map<string, TouchpointPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointPreferenceStore implements TouchpointPreferenceStore {
  inner: TouchpointPreferenceStore;
  cache: cache.TtlCache<TouchpointPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointPreferenceStore,
    cacheValue: cache.TtlCache<TouchpointPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointPreference | undefined {
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

  save(item: TouchpointPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointPreference[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointPreferenceStore(inner: TouchpointPreferenceStore, ttl: number, clockValue: clock.Clock): TouchpointPreferenceStore {
  return new CachedTouchpointPreferenceStore(inner, cache.newTtlCache<TouchpointPreference>(64, ttl, clockValue), 0, 0);
}

/** Selects touchpoint preferences. Empty fields match all. */
export class TouchpointPreferenceQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointPreference): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointPreference[]): TouchpointPreference[] {
    const matched = collections.filter(items, (candidate: TouchpointPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointPreferences(store: TouchpointPreferenceStore, query: TouchpointPreferenceQuery): TouchpointPreference[] {
  return query.apply(store.list());
}
