import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSenderEntry } from "./pending-sender-entry.js";

/** Keeps pending sender entries by code. */
export interface PendingSenderEntryStore {
  find(code: string): PendingSenderEntry | undefined;
  save(item: PendingSenderEntry): void;
  remove(code: string): boolean;
  list(): PendingSenderEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSenderEntryStore implements PendingSenderEntryStore {
  items: Map<string, PendingSenderEntry>;
  order: string[];

  constructor(items: Map<string, PendingSenderEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSenderEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSenderEntry): void {
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

  list(): PendingSenderEntry[] {
    const out: PendingSenderEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSenderEntryStore(): PendingSenderEntryStore {
  return new MemoryPendingSenderEntryStore(new Map<string, PendingSenderEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSenderEntryStore implements PendingSenderEntryStore {
  inner: PendingSenderEntryStore;
  cache: cache.TtlCache<PendingSenderEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSenderEntryStore,
    cacheValue: cache.TtlCache<PendingSenderEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSenderEntry | undefined {
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

  save(item: PendingSenderEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSenderEntry[] {
    return this.inner.list();
  }
}

export function newCachedPendingSenderEntryStore(inner: PendingSenderEntryStore, ttl: number, clockValue: clock.Clock): PendingSenderEntryStore {
  return new CachedPendingSenderEntryStore(inner, cache.newTtlCache<PendingSenderEntry>(512, ttl, clockValue), 0, 0);
}

/** Selects pending sender entries. Empty fields match all. */
export class PendingSenderEntryQuery {
  segment: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBid: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSenderEntry): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSenderEntry[]): PendingSenderEntry[] {
    const matched = collections.filter(items, (candidate: PendingSenderEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSenderEntries(store: PendingSenderEntryStore, query: PendingSenderEntryQuery): PendingSenderEntry[] {
  return query.apply(store.list());
}
