import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPathEntry } from "./scheduled-path-entry.js";

/** Keeps scheduled path entries by code. */
export interface ScheduledPathEntryStore {
  find(code: string): ScheduledPathEntry | undefined;
  save(item: ScheduledPathEntry): void;
  remove(code: string): boolean;
  list(): ScheduledPathEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPathEntryStore implements ScheduledPathEntryStore {
  items: Map<string, ScheduledPathEntry>;
  order: string[];

  constructor(items: Map<string, ScheduledPathEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPathEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPathEntry): void {
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

  list(): ScheduledPathEntry[] {
    const out: ScheduledPathEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPathEntryStore(): ScheduledPathEntryStore {
  return new MemoryScheduledPathEntryStore(new Map<string, ScheduledPathEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPathEntryStore implements ScheduledPathEntryStore {
  inner: ScheduledPathEntryStore;
  cache: cache.TtlCache<ScheduledPathEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPathEntryStore,
    cacheValue: cache.TtlCache<ScheduledPathEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPathEntry | undefined {
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

  save(item: ScheduledPathEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPathEntry[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPathEntryStore(inner: ScheduledPathEntryStore, ttl: number, clockValue: clock.Clock): ScheduledPathEntryStore {
  return new CachedScheduledPathEntryStore(inner, cache.newTtlCache<ScheduledPathEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled path entries. Empty fields match all. */
export class ScheduledPathEntryQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPathEntry): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPathEntry[]): ScheduledPathEntry[] {
    const matched = collections.filter(items, (candidate: ScheduledPathEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPathEntries(store: ScheduledPathEntryStore, query: ScheduledPathEntryQuery): ScheduledPathEntry[] {
  return query.apply(store.list());
}
