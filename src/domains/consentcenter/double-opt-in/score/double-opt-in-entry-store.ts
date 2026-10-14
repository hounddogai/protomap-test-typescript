import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInEntry } from "./double-opt-in-entry.js";

/** Keeps double opt in entries by code. */
export interface DoubleOptInEntryStore {
  find(code: string): DoubleOptInEntry | undefined;
  save(item: DoubleOptInEntry): void;
  remove(code: string): boolean;
  list(): DoubleOptInEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInEntryStore implements DoubleOptInEntryStore {
  items: Map<string, DoubleOptInEntry>;
  order: string[];

  constructor(items: Map<string, DoubleOptInEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInEntry): void {
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

  list(): DoubleOptInEntry[] {
    const out: DoubleOptInEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInEntryStore(): DoubleOptInEntryStore {
  return new MemoryDoubleOptInEntryStore(new Map<string, DoubleOptInEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInEntryStore implements DoubleOptInEntryStore {
  inner: DoubleOptInEntryStore;
  cache: cache.TtlCache<DoubleOptInEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInEntryStore,
    cacheValue: cache.TtlCache<DoubleOptInEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInEntry | undefined {
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

  save(item: DoubleOptInEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInEntry[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInEntryStore(inner: DoubleOptInEntryStore, ttl: number, clockValue: clock.Clock): DoubleOptInEntryStore {
  return new CachedDoubleOptInEntryStore(inner, cache.newTtlCache<DoubleOptInEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects double opt in entries. Empty fields match all. */
export class DoubleOptInEntryQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInEntry[]): DoubleOptInEntry[] {
    const matched = collections.filter(items, (candidate: DoubleOptInEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInEntries(store: DoubleOptInEntryStore, query: DoubleOptInEntryQuery): DoubleOptInEntry[] {
  return query.apply(store.list());
}
