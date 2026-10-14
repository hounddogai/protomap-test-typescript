import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupRecord } from "./warmup-record.js";

/** Keeps warmup records by code. */
export interface WarmupRecordStore {
  find(code: string): WarmupRecord | undefined;
  save(item: WarmupRecord): void;
  remove(code: string): boolean;
  list(): WarmupRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupRecordStore implements WarmupRecordStore {
  items: Map<string, WarmupRecord>;
  order: string[];

  constructor(items: Map<string, WarmupRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupRecord): void {
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

  list(): WarmupRecord[] {
    const out: WarmupRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupRecordStore(): WarmupRecordStore {
  return new MemoryWarmupRecordStore(new Map<string, WarmupRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupRecordStore implements WarmupRecordStore {
  inner: WarmupRecordStore;
  cache: cache.TtlCache<WarmupRecord>;
  hits: number;
  misses: number;

  constructor(inner: WarmupRecordStore, cacheValue: cache.TtlCache<WarmupRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupRecord | undefined {
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

  save(item: WarmupRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupRecord[] {
    return this.inner.list();
  }
}

export function newCachedWarmupRecordStore(inner: WarmupRecordStore, ttl: number, clockValue: clock.Clock): WarmupRecordStore {
  return new CachedWarmupRecordStore(inner, cache.newTtlCache<WarmupRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup records. Empty fields match all. */
export class WarmupRecordQuery {
  name: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minScore: number, statuses: string[], limit: number) {
    this.name = name;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupRecord[]): WarmupRecord[] {
    const matched = collections.filter(items, (candidate: WarmupRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupRecords(store: WarmupRecordStore, query: WarmupRecordQuery): WarmupRecord[] {
  return query.apply(store.list());
}
