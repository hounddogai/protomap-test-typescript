import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionEntry } from "./deflection-entry.js";

/** Keeps deflection entries by code. */
export interface DeflectionEntryStore {
  find(code: string): DeflectionEntry | undefined;
  save(item: DeflectionEntry): void;
  remove(code: string): boolean;
  list(): DeflectionEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionEntryStore implements DeflectionEntryStore {
  items: Map<string, DeflectionEntry>;
  order: string[];

  constructor(items: Map<string, DeflectionEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionEntry): void {
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

  list(): DeflectionEntry[] {
    const out: DeflectionEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionEntryStore(): DeflectionEntryStore {
  return new MemoryDeflectionEntryStore(new Map<string, DeflectionEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionEntryStore implements DeflectionEntryStore {
  inner: DeflectionEntryStore;
  cache: cache.TtlCache<DeflectionEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionEntryStore,
    cacheValue: cache.TtlCache<DeflectionEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionEntry | undefined {
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

  save(item: DeflectionEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionEntry[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionEntryStore(inner: DeflectionEntryStore, ttl: number, clockValue: clock.Clock): DeflectionEntryStore {
  return new CachedDeflectionEntryStore(inner, cache.newTtlCache<DeflectionEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects deflection entries. Empty fields match all. */
export class DeflectionEntryQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionEntry[]): DeflectionEntry[] {
    const matched = collections.filter(items, (candidate: DeflectionEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionEntries(store: DeflectionEntryStore, query: DeflectionEntryQuery): DeflectionEntry[] {
  return query.apply(store.list());
}
