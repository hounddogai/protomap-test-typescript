import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredActivationRecord } from "./tiered-activation-record.js";

/** Keeps tiered activation records by code. */
export interface TieredActivationRecordStore {
  find(code: string): TieredActivationRecord | undefined;
  save(item: TieredActivationRecord): void;
  remove(code: string): boolean;
  list(): TieredActivationRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredActivationRecordStore implements TieredActivationRecordStore {
  items: Map<string, TieredActivationRecord>;
  order: string[];

  constructor(items: Map<string, TieredActivationRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredActivationRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredActivationRecord): void {
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

  list(): TieredActivationRecord[] {
    const out: TieredActivationRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredActivationRecordStore(): TieredActivationRecordStore {
  return new MemoryTieredActivationRecordStore(new Map<string, TieredActivationRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredActivationRecordStore implements TieredActivationRecordStore {
  inner: TieredActivationRecordStore;
  cache: cache.TtlCache<TieredActivationRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredActivationRecordStore,
    cacheValue: cache.TtlCache<TieredActivationRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredActivationRecord | undefined {
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

  save(item: TieredActivationRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredActivationRecord[] {
    return this.inner.list();
  }
}

export function newCachedTieredActivationRecordStore(inner: TieredActivationRecordStore, ttl: number, clockValue: clock.Clock): TieredActivationRecordStore {
  return new CachedTieredActivationRecordStore(
    inner,
    cache.newTtlCache<TieredActivationRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered activation records. Empty fields match all. */
export class TieredActivationRecordQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredActivationRecord): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredActivationRecord[]): TieredActivationRecord[] {
    const matched = collections.filter(items, (candidate: TieredActivationRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredActivationRecords(store: TieredActivationRecordStore, query: TieredActivationRecordQuery): TieredActivationRecord[] {
  return query.apply(store.list());
}
