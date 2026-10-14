import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInPreference } from "./double-opt-in-preference.js";

/** Keeps double opt in preferences by code. */
export interface DoubleOptInPreferenceStore {
  find(code: string): DoubleOptInPreference | undefined;
  save(item: DoubleOptInPreference): void;
  remove(code: string): boolean;
  list(): DoubleOptInPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInPreferenceStore implements DoubleOptInPreferenceStore {
  items: Map<string, DoubleOptInPreference>;
  order: string[];

  constructor(items: Map<string, DoubleOptInPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInPreference): void {
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

  list(): DoubleOptInPreference[] {
    const out: DoubleOptInPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInPreferenceStore(): DoubleOptInPreferenceStore {
  return new MemoryDoubleOptInPreferenceStore(new Map<string, DoubleOptInPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInPreferenceStore implements DoubleOptInPreferenceStore {
  inner: DoubleOptInPreferenceStore;
  cache: cache.TtlCache<DoubleOptInPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInPreferenceStore,
    cacheValue: cache.TtlCache<DoubleOptInPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInPreference | undefined {
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

  save(item: DoubleOptInPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInPreference[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInPreferenceStore(inner: DoubleOptInPreferenceStore, ttl: number, clockValue: clock.Clock): DoubleOptInPreferenceStore {
  return new CachedDoubleOptInPreferenceStore(
    inner,
    cache.newTtlCache<DoubleOptInPreference>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects double opt in preferences. Empty fields match all. */
export class DoubleOptInPreferenceQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInPreference[]): DoubleOptInPreference[] {
    const matched = collections.filter(items, (candidate: DoubleOptInPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInPreferences(store: DoubleOptInPreferenceStore, query: DoubleOptInPreferenceQuery): DoubleOptInPreference[] {
  return query.apply(store.list());
}
