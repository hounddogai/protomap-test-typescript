import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBadgeEntry } from "./primary-badge-entry.js";

/** Keeps primary badge entries by code. */
export interface PrimaryBadgeEntryStore {
  find(code: string): PrimaryBadgeEntry | undefined;
  save(item: PrimaryBadgeEntry): void;
  remove(code: string): boolean;
  list(): PrimaryBadgeEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBadgeEntryStore implements PrimaryBadgeEntryStore {
  items: Map<string, PrimaryBadgeEntry>;
  order: string[];

  constructor(items: Map<string, PrimaryBadgeEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBadgeEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBadgeEntry): void {
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

  list(): PrimaryBadgeEntry[] {
    const out: PrimaryBadgeEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBadgeEntryStore(): PrimaryBadgeEntryStore {
  return new MemoryPrimaryBadgeEntryStore(new Map<string, PrimaryBadgeEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBadgeEntryStore implements PrimaryBadgeEntryStore {
  inner: PrimaryBadgeEntryStore;
  cache: cache.TtlCache<PrimaryBadgeEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBadgeEntryStore,
    cacheValue: cache.TtlCache<PrimaryBadgeEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBadgeEntry | undefined {
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

  save(item: PrimaryBadgeEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBadgeEntry[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBadgeEntryStore(inner: PrimaryBadgeEntryStore, ttl: number, clockValue: clock.Clock): PrimaryBadgeEntryStore {
  return new CachedPrimaryBadgeEntryStore(inner, cache.newTtlCache<PrimaryBadgeEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary badge entries. Empty fields match all. */
export class PrimaryBadgeEntryQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBadgeEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBadgeEntry[]): PrimaryBadgeEntry[] {
    const matched = collections.filter(items, (candidate: PrimaryBadgeEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBadgeEntries(store: PrimaryBadgeEntryStore, query: PrimaryBadgeEntryQuery): PrimaryBadgeEntry[] {
  return query.apply(store.list());
}
