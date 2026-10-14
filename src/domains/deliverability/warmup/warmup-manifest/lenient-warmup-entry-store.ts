import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWarmupEntry } from "./lenient-warmup-entry.js";

/** Keeps lenient warmup entries by code. */
export interface LenientWarmupEntryStore {
  find(code: string): LenientWarmupEntry | undefined;
  save(item: LenientWarmupEntry): void;
  remove(code: string): boolean;
  list(): LenientWarmupEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWarmupEntryStore implements LenientWarmupEntryStore {
  items: Map<string, LenientWarmupEntry>;
  order: string[];

  constructor(items: Map<string, LenientWarmupEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWarmupEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWarmupEntry): void {
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

  list(): LenientWarmupEntry[] {
    const out: LenientWarmupEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWarmupEntryStore(): LenientWarmupEntryStore {
  return new MemoryLenientWarmupEntryStore(new Map<string, LenientWarmupEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWarmupEntryStore implements LenientWarmupEntryStore {
  inner: LenientWarmupEntryStore;
  cache: cache.TtlCache<LenientWarmupEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWarmupEntryStore,
    cacheValue: cache.TtlCache<LenientWarmupEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWarmupEntry | undefined {
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

  save(item: LenientWarmupEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWarmupEntry[] {
    return this.inner.list();
  }
}

export function newCachedLenientWarmupEntryStore(inner: LenientWarmupEntryStore, ttl: number, clockValue: clock.Clock): LenientWarmupEntryStore {
  return new CachedLenientWarmupEntryStore(inner, cache.newTtlCache<LenientWarmupEntry>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient warmup entries. Empty fields match all. */
export class LenientWarmupEntryQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWarmupEntry): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWarmupEntry[]): LenientWarmupEntry[] {
    const matched = collections.filter(items, (candidate: LenientWarmupEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWarmupEntries(store: LenientWarmupEntryStore, query: LenientWarmupEntryQuery): LenientWarmupEntry[] {
  return query.apply(store.list());
}
