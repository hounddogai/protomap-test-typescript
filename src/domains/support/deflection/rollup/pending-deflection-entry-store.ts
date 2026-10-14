import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingDeflectionEntry } from "./pending-deflection-entry.js";

/** Keeps pending deflection entries by code. */
export interface PendingDeflectionEntryStore {
  find(code: string): PendingDeflectionEntry | undefined;
  save(item: PendingDeflectionEntry): void;
  remove(code: string): boolean;
  list(): PendingDeflectionEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingDeflectionEntryStore implements PendingDeflectionEntryStore {
  items: Map<string, PendingDeflectionEntry>;
  order: string[];

  constructor(items: Map<string, PendingDeflectionEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingDeflectionEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingDeflectionEntry): void {
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

  list(): PendingDeflectionEntry[] {
    const out: PendingDeflectionEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingDeflectionEntryStore(): PendingDeflectionEntryStore {
  return new MemoryPendingDeflectionEntryStore(new Map<string, PendingDeflectionEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingDeflectionEntryStore implements PendingDeflectionEntryStore {
  inner: PendingDeflectionEntryStore;
  cache: cache.TtlCache<PendingDeflectionEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingDeflectionEntryStore,
    cacheValue: cache.TtlCache<PendingDeflectionEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingDeflectionEntry | undefined {
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

  save(item: PendingDeflectionEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingDeflectionEntry[] {
    return this.inner.list();
  }
}

export function newCachedPendingDeflectionEntryStore(inner: PendingDeflectionEntryStore, ttl: number, clockValue: clock.Clock): PendingDeflectionEntryStore {
  return new CachedPendingDeflectionEntryStore(
    inner,
    cache.newTtlCache<PendingDeflectionEntry>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending deflection entries. Empty fields match all. */
export class PendingDeflectionEntryQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingDeflectionEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingDeflectionEntry[]): PendingDeflectionEntry[] {
    const matched = collections.filter(items, (candidate: PendingDeflectionEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingDeflectionEntries(store: PendingDeflectionEntryStore, query: PendingDeflectionEntryQuery): PendingDeflectionEntry[] {
  return query.apply(store.list());
}
