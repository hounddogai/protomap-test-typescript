import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitPreference } from "./wait-preference.js";

/** Keeps wait preferences by code. */
export interface WaitPreferenceStore {
  find(code: string): WaitPreference | undefined;
  save(item: WaitPreference): void;
  remove(code: string): boolean;
  list(): WaitPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitPreferenceStore implements WaitPreferenceStore {
  items: Map<string, WaitPreference>;
  order: string[];

  constructor(items: Map<string, WaitPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitPreference): void {
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

  list(): WaitPreference[] {
    const out: WaitPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitPreferenceStore(): WaitPreferenceStore {
  return new MemoryWaitPreferenceStore(new Map<string, WaitPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitPreferenceStore implements WaitPreferenceStore {
  inner: WaitPreferenceStore;
  cache: cache.TtlCache<WaitPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: WaitPreferenceStore,
    cacheValue: cache.TtlCache<WaitPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitPreference | undefined {
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

  save(item: WaitPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitPreference[] {
    return this.inner.list();
  }
}

export function newCachedWaitPreferenceStore(inner: WaitPreferenceStore, ttl: number, clockValue: clock.Clock): WaitPreferenceStore {
  return new CachedWaitPreferenceStore(inner, cache.newTtlCache<WaitPreference>(64, ttl, clockValue), 0, 0);
}

/** Selects wait preferences. Empty fields match all. */
export class WaitPreferenceQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitPreference): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitPreference[]): WaitPreference[] {
    const matched = collections.filter(items, (candidate: WaitPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitPreferences(store: WaitPreferenceStore, query: WaitPreferenceQuery): WaitPreference[] {
  return query.apply(store.list());
}
