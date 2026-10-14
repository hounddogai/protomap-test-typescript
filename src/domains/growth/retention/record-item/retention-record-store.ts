import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionRecord } from "./retention-record.js";

/** Keeps retention records by code. */
export interface RetentionRecordStore {
  find(code: string): RetentionRecord | undefined;
  save(item: RetentionRecord): void;
  remove(code: string): boolean;
  list(): RetentionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionRecordStore implements RetentionRecordStore {
  items: Map<string, RetentionRecord>;
  order: string[];

  constructor(items: Map<string, RetentionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionRecord): void {
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

  list(): RetentionRecord[] {
    const out: RetentionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionRecordStore(): RetentionRecordStore {
  return new MemoryRetentionRecordStore(new Map<string, RetentionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionRecordStore implements RetentionRecordStore {
  inner: RetentionRecordStore;
  cache: cache.TtlCache<RetentionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionRecordStore,
    cacheValue: cache.TtlCache<RetentionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionRecord | undefined {
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

  save(item: RetentionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionRecord[] {
    return this.inner.list();
  }
}

export function newCachedRetentionRecordStore(inner: RetentionRecordStore, ttl: number, clockValue: clock.Clock): RetentionRecordStore {
  return new CachedRetentionRecordStore(inner, cache.newTtlCache<RetentionRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects retention records. Empty fields match all. */
export class RetentionRecordQuery {
  channel: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMinimum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionRecord[]): RetentionRecord[] {
    const matched = collections.filter(items, (candidate: RetentionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionRecords(store: RetentionRecordStore, query: RetentionRecordQuery): RetentionRecord[] {
  return query.apply(store.list());
}
