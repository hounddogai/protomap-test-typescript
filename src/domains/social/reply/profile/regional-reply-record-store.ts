import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalReplyRecord } from "./regional-reply-record.js";

/** Keeps regional reply records by code. */
export interface RegionalReplyRecordStore {
  find(code: string): RegionalReplyRecord | undefined;
  save(item: RegionalReplyRecord): void;
  remove(code: string): boolean;
  list(): RegionalReplyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalReplyRecordStore implements RegionalReplyRecordStore {
  items: Map<string, RegionalReplyRecord>;
  order: string[];

  constructor(items: Map<string, RegionalReplyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalReplyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalReplyRecord): void {
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

  list(): RegionalReplyRecord[] {
    const out: RegionalReplyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalReplyRecordStore(): RegionalReplyRecordStore {
  return new MemoryRegionalReplyRecordStore(new Map<string, RegionalReplyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalReplyRecordStore implements RegionalReplyRecordStore {
  inner: RegionalReplyRecordStore;
  cache: cache.TtlCache<RegionalReplyRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalReplyRecordStore,
    cacheValue: cache.TtlCache<RegionalReplyRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalReplyRecord | undefined {
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

  save(item: RegionalReplyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalReplyRecord[] {
    return this.inner.list();
  }
}

export function newCachedRegionalReplyRecordStore(inner: RegionalReplyRecordStore, ttl: number, clockValue: clock.Clock): RegionalReplyRecordStore {
  return new CachedRegionalReplyRecordStore(inner, cache.newTtlCache<RegionalReplyRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional reply records. Empty fields match all. */
export class RegionalReplyRecordQuery {
  utmSource: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minSequence: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalReplyRecord): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalReplyRecord[]): RegionalReplyRecord[] {
    const matched = collections.filter(items, (candidate: RegionalReplyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalReplyRecords(store: RegionalReplyRecordStore, query: RegionalReplyRecordQuery): RegionalReplyRecord[] {
  return query.apply(store.list());
}
