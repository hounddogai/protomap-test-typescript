import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowPreference } from "./window-preference.js";

/** Keeps window preferences by code. */
export interface WindowPreferenceStore {
  find(code: string): WindowPreference | undefined;
  save(item: WindowPreference): void;
  remove(code: string): boolean;
  list(): WindowPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowPreferenceStore implements WindowPreferenceStore {
  items: Map<string, WindowPreference>;
  order: string[];

  constructor(items: Map<string, WindowPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowPreference): void {
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

  list(): WindowPreference[] {
    const out: WindowPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowPreferenceStore(): WindowPreferenceStore {
  return new MemoryWindowPreferenceStore(new Map<string, WindowPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowPreferenceStore implements WindowPreferenceStore {
  inner: WindowPreferenceStore;
  cache: cache.TtlCache<WindowPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: WindowPreferenceStore,
    cacheValue: cache.TtlCache<WindowPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowPreference | undefined {
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

  save(item: WindowPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowPreference[] {
    return this.inner.list();
  }
}

export function newCachedWindowPreferenceStore(inner: WindowPreferenceStore, ttl: number, clockValue: clock.Clock): WindowPreferenceStore {
  return new CachedWindowPreferenceStore(inner, cache.newTtlCache<WindowPreference>(1024, ttl, clockValue), 0, 0);
}

/** Selects window preferences. Empty fields match all. */
export class WindowPreferenceQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowPreference): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowPreference[]): WindowPreference[] {
    const matched = collections.filter(items, (candidate: WindowPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowPreferences(store: WindowPreferenceStore, query: WindowPreferenceQuery): WindowPreference[] {
  return query.apply(store.list());
}
