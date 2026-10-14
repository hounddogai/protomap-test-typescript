import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryWindowPreference } from "./primary-window-preference.js";

/** Keeps primary window preferences by code. */
export interface PrimaryWindowPreferenceStore {
  find(code: string): PrimaryWindowPreference | undefined;
  save(item: PrimaryWindowPreference): void;
  remove(code: string): boolean;
  list(): PrimaryWindowPreference[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryWindowPreferenceStore implements PrimaryWindowPreferenceStore {
  items: Map<string, PrimaryWindowPreference>;
  order: string[];

  constructor(items: Map<string, PrimaryWindowPreference>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryWindowPreference | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryWindowPreference): void {
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

  list(): PrimaryWindowPreference[] {
    const out: PrimaryWindowPreference[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryWindowPreferenceStore(): PrimaryWindowPreferenceStore {
  return new MemoryPrimaryWindowPreferenceStore(new Map<string, PrimaryWindowPreference>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryWindowPreferenceStore implements PrimaryWindowPreferenceStore {
  inner: PrimaryWindowPreferenceStore;
  cache: cache.TtlCache<PrimaryWindowPreference>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryWindowPreferenceStore,
    cacheValue: cache.TtlCache<PrimaryWindowPreference>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryWindowPreference | undefined {
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

  save(item: PrimaryWindowPreference): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryWindowPreference[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryWindowPreferenceStore(inner: PrimaryWindowPreferenceStore, ttl: number, clockValue: clock.Clock): PrimaryWindowPreferenceStore {
  return new CachedPrimaryWindowPreferenceStore(
    inner,
    cache.newTtlCache<PrimaryWindowPreference>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary window preferences. Empty fields match all. */
export class PrimaryWindowPreferenceQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryWindowPreference): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryWindowPreference[]): PrimaryWindowPreference[] {
    const matched = collections.filter(items, (candidate: PrimaryWindowPreference): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryWindowPreferences(store: PrimaryWindowPreferenceStore, query: PrimaryWindowPreferenceQuery): PrimaryWindowPreference[] {
  return query.apply(store.list());
}
