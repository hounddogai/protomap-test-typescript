import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupEntry } from "./warmup-entry.js";

/** Keeps warmup entries by code. */
export interface WarmupEntryStore {
  find(code: string): WarmupEntry | undefined;
  save(item: WarmupEntry): void;
  remove(code: string): boolean;
  list(): WarmupEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupEntryStore implements WarmupEntryStore {
  items: Map<string, WarmupEntry>;
  order: string[];

  constructor(items: Map<string, WarmupEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupEntry): void {
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

  list(): WarmupEntry[] {
    const out: WarmupEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupEntryStore(): WarmupEntryStore {
  return new MemoryWarmupEntryStore(new Map<string, WarmupEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupEntryStore implements WarmupEntryStore {
  inner: WarmupEntryStore;
  cache: cache.TtlCache<WarmupEntry>;
  hits: number;
  misses: number;

  constructor(inner: WarmupEntryStore, cacheValue: cache.TtlCache<WarmupEntry>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupEntry | undefined {
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

  save(item: WarmupEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupEntry[] {
    return this.inner.list();
  }
}

export function newCachedWarmupEntryStore(inner: WarmupEntryStore, ttl: number, clockValue: clock.Clock): WarmupEntryStore {
  return new CachedWarmupEntryStore(inner, cache.newTtlCache<WarmupEntry>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup entries. Empty fields match all. */
export class WarmupEntryQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupEntry[]): WarmupEntry[] {
    const matched = collections.filter(items, (candidate: WarmupEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupEntries(store: WarmupEntryStore, query: WarmupEntryQuery): WarmupEntry[] {
  return query.apply(store.list());
}
