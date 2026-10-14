import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPathEntry } from "./strict-path-entry.js";

/** Keeps strict path entries by code. */
export interface StrictPathEntryStore {
  find(code: string): StrictPathEntry | undefined;
  save(item: StrictPathEntry): void;
  remove(code: string): boolean;
  list(): StrictPathEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPathEntryStore implements StrictPathEntryStore {
  items: Map<string, StrictPathEntry>;
  order: string[];

  constructor(items: Map<string, StrictPathEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPathEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPathEntry): void {
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

  list(): StrictPathEntry[] {
    const out: StrictPathEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPathEntryStore(): StrictPathEntryStore {
  return new MemoryStrictPathEntryStore(new Map<string, StrictPathEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPathEntryStore implements StrictPathEntryStore {
  inner: StrictPathEntryStore;
  cache: cache.TtlCache<StrictPathEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPathEntryStore,
    cacheValue: cache.TtlCache<StrictPathEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPathEntry | undefined {
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

  save(item: StrictPathEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPathEntry[] {
    return this.inner.list();
  }
}

export function newCachedStrictPathEntryStore(inner: StrictPathEntryStore, ttl: number, clockValue: clock.Clock): StrictPathEntryStore {
  return new CachedStrictPathEntryStore(inner, cache.newTtlCache<StrictPathEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects strict path entries. Empty fields match all. */
export class StrictPathEntryQuery {
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

  matches(item: StrictPathEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPathEntry[]): StrictPathEntry[] {
    const matched = collections.filter(items, (candidate: StrictPathEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPathEntries(store: StrictPathEntryStore, query: StrictPathEntryQuery): StrictPathEntry[] {
  return query.apply(store.list());
}
