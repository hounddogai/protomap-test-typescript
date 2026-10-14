import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryOptOutEntry } from "./primary-opt-out-entry.js";

/** Keeps primary opt out entries by code. */
export interface PrimaryOptOutEntryStore {
  find(code: string): PrimaryOptOutEntry | undefined;
  save(item: PrimaryOptOutEntry): void;
  remove(code: string): boolean;
  list(): PrimaryOptOutEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryOptOutEntryStore implements PrimaryOptOutEntryStore {
  items: Map<string, PrimaryOptOutEntry>;
  order: string[];

  constructor(items: Map<string, PrimaryOptOutEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryOptOutEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryOptOutEntry): void {
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

  list(): PrimaryOptOutEntry[] {
    const out: PrimaryOptOutEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryOptOutEntryStore(): PrimaryOptOutEntryStore {
  return new MemoryPrimaryOptOutEntryStore(new Map<string, PrimaryOptOutEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryOptOutEntryStore implements PrimaryOptOutEntryStore {
  inner: PrimaryOptOutEntryStore;
  cache: cache.TtlCache<PrimaryOptOutEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryOptOutEntryStore,
    cacheValue: cache.TtlCache<PrimaryOptOutEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryOptOutEntry | undefined {
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

  save(item: PrimaryOptOutEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryOptOutEntry[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryOptOutEntryStore(inner: PrimaryOptOutEntryStore, ttl: number, clockValue: clock.Clock): PrimaryOptOutEntryStore {
  return new CachedPrimaryOptOutEntryStore(inner, cache.newTtlCache<PrimaryOptOutEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary opt out entries. Empty fields match all. */
export class PrimaryOptOutEntryQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryOptOutEntry): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryOptOutEntry[]): PrimaryOptOutEntry[] {
    const matched = collections.filter(items, (candidate: PrimaryOptOutEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryOptOutEntries(store: PrimaryOptOutEntryStore, query: PrimaryOptOutEntryQuery): PrimaryOptOutEntry[] {
  return query.apply(store.list());
}
