import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyRecord } from "./reply-record.js";

/** Keeps reply records by code. */
export interface ReplyRecordStore {
  find(code: string): ReplyRecord | undefined;
  save(item: ReplyRecord): void;
  remove(code: string): boolean;
  list(): ReplyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyRecordStore implements ReplyRecordStore {
  items: Map<string, ReplyRecord>;
  order: string[];

  constructor(items: Map<string, ReplyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyRecord): void {
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

  list(): ReplyRecord[] {
    const out: ReplyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyRecordStore(): ReplyRecordStore {
  return new MemoryReplyRecordStore(new Map<string, ReplyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyRecordStore implements ReplyRecordStore {
  inner: ReplyRecordStore;
  cache: cache.TtlCache<ReplyRecord>;
  hits: number;
  misses: number;

  constructor(inner: ReplyRecordStore, cacheValue: cache.TtlCache<ReplyRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyRecord | undefined {
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

  save(item: ReplyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyRecord[] {
    return this.inner.list();
  }
}

export function newCachedReplyRecordStore(inner: ReplyRecordStore, ttl: number, clockValue: clock.Clock): ReplyRecordStore {
  return new CachedReplyRecordStore(inner, cache.newTtlCache<ReplyRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects reply records. Empty fields match all. */
export class ReplyRecordQuery {
  country: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minThreshold: number, statuses: string[], limit: number) {
    this.country = country;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyRecord): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyRecord[]): ReplyRecord[] {
    const matched = collections.filter(items, (candidate: ReplyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyRecords(store: ReplyRecordStore, query: ReplyRecordQuery): ReplyRecord[] {
  return query.apply(store.list());
}
