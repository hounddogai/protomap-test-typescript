import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingEntry } from "./pacing-entry.js";

/** Keeps pacing entries by code. */
export interface PacingEntryStore {
  find(code: string): PacingEntry | undefined;
  save(item: PacingEntry): void;
  remove(code: string): boolean;
  list(): PacingEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingEntryStore implements PacingEntryStore {
  items: Map<string, PacingEntry>;
  order: string[];

  constructor(items: Map<string, PacingEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingEntry): void {
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

  list(): PacingEntry[] {
    const out: PacingEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingEntryStore(): PacingEntryStore {
  return new MemoryPacingEntryStore(new Map<string, PacingEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingEntryStore implements PacingEntryStore {
  inner: PacingEntryStore;
  cache: cache.TtlCache<PacingEntry>;
  hits: number;
  misses: number;

  constructor(inner: PacingEntryStore, cacheValue: cache.TtlCache<PacingEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingEntry | undefined {
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

  save(item: PacingEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingEntry[] {
    return this.inner.list();
  }
}

export function newCachedPacingEntryStore(inner: PacingEntryStore, ttl: number, clockValue: clock.Clock): PacingEntryStore {
  return new CachedPacingEntryStore(inner, cache.newTtlCache<PacingEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects pacing entries. Empty fields match all. */
export class PacingEntryQuery {
  locale: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minWindowDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingEntry[]): PacingEntry[] {
    const matched = collections.filter(items, (candidate: PacingEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingEntries(store: PacingEntryStore, query: PacingEntryQuery): PacingEntry[] {
  return query.apply(store.list());
}
