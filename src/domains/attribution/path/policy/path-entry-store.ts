import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathEntry } from "./path-entry.js";

/** Keeps path entries by code. */
export interface PathEntryStore {
  find(code: string): PathEntry | undefined;
  save(item: PathEntry): void;
  remove(code: string): boolean;
  list(): PathEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathEntryStore implements PathEntryStore {
  items: Map<string, PathEntry>;
  order: string[];

  constructor(items: Map<string, PathEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathEntry): void {
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

  list(): PathEntry[] {
    const out: PathEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathEntryStore(): PathEntryStore {
  return new MemoryPathEntryStore(new Map<string, PathEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathEntryStore implements PathEntryStore {
  inner: PathEntryStore;
  cache: cache.TtlCache<PathEntry>;
  hits: number;
  misses: number;

  constructor(inner: PathEntryStore, cacheValue: cache.TtlCache<PathEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathEntry | undefined {
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

  save(item: PathEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathEntry[] {
    return this.inner.list();
  }
}

export function newCachedPathEntryStore(inner: PathEntryStore, ttl: number, clockValue: clock.Clock): PathEntryStore {
  return new CachedPathEntryStore(inner, cache.newTtlCache<PathEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects path entries. Empty fields match all. */
export class PathEntryQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathEntry[]): PathEntry[] {
    const matched = collections.filter(items, (candidate: PathEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathEntries(store: PathEntryStore, query: PathEntryQuery): PathEntry[] {
  return query.apply(store.list());
}
