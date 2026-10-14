import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckRecord } from "./fraud-check-record.js";

/** Keeps fraud check records by code. */
export interface FraudCheckRecordStore {
  find(code: string): FraudCheckRecord | undefined;
  save(item: FraudCheckRecord): void;
  remove(code: string): boolean;
  list(): FraudCheckRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckRecordStore implements FraudCheckRecordStore {
  items: Map<string, FraudCheckRecord>;
  order: string[];

  constructor(items: Map<string, FraudCheckRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckRecord): void {
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

  list(): FraudCheckRecord[] {
    const out: FraudCheckRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckRecordStore(): FraudCheckRecordStore {
  return new MemoryFraudCheckRecordStore(new Map<string, FraudCheckRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckRecordStore implements FraudCheckRecordStore {
  inner: FraudCheckRecordStore;
  cache: cache.TtlCache<FraudCheckRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckRecordStore,
    cacheValue: cache.TtlCache<FraudCheckRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckRecord | undefined {
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

  save(item: FraudCheckRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckRecord[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckRecordStore(inner: FraudCheckRecordStore, ttl: number, clockValue: clock.Clock): FraudCheckRecordStore {
  return new CachedFraudCheckRecordStore(inner, cache.newTtlCache<FraudCheckRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects fraud check records. Empty fields match all. */
export class FraudCheckRecordQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckRecord[]): FraudCheckRecord[] {
    const matched = collections.filter(items, (candidate: FraudCheckRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckRecords(store: FraudCheckRecordStore, query: FraudCheckRecordQuery): FraudCheckRecord[] {
  return query.apply(store.list());
}
