import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackNudgeEntry } from "./fallback-nudge-entry.js";

/** Keeps fallback nudge entries by code. */
export interface FallbackNudgeEntryStore {
  find(code: string): FallbackNudgeEntry | undefined;
  save(item: FallbackNudgeEntry): void;
  remove(code: string): boolean;
  list(): FallbackNudgeEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackNudgeEntryStore implements FallbackNudgeEntryStore {
  items: Map<string, FallbackNudgeEntry>;
  order: string[];

  constructor(items: Map<string, FallbackNudgeEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackNudgeEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackNudgeEntry): void {
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

  list(): FallbackNudgeEntry[] {
    const out: FallbackNudgeEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackNudgeEntryStore(): FallbackNudgeEntryStore {
  return new MemoryFallbackNudgeEntryStore(new Map<string, FallbackNudgeEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackNudgeEntryStore implements FallbackNudgeEntryStore {
  inner: FallbackNudgeEntryStore;
  cache: cache.TtlCache<FallbackNudgeEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackNudgeEntryStore,
    cacheValue: cache.TtlCache<FallbackNudgeEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackNudgeEntry | undefined {
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

  save(item: FallbackNudgeEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackNudgeEntry[] {
    return this.inner.list();
  }
}

export function newCachedFallbackNudgeEntryStore(inner: FallbackNudgeEntryStore, ttl: number, clockValue: clock.Clock): FallbackNudgeEntryStore {
  return new CachedFallbackNudgeEntryStore(inner, cache.newTtlCache<FallbackNudgeEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback nudge entries. Empty fields match all. */
export class FallbackNudgeEntryQuery {
  channel: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRatio: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackNudgeEntry): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackNudgeEntry[]): FallbackNudgeEntry[] {
    const matched = collections.filter(items, (candidate: FallbackNudgeEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackNudgeEntries(store: FallbackNudgeEntryStore, query: FallbackNudgeEntryQuery): FallbackNudgeEntry[] {
  return query.apply(store.list());
}
