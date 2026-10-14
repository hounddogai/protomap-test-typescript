import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualCreditRecord } from "./manual-credit-record.js";

/** Keeps manual credit records by code. */
export interface ManualCreditRecordStore {
  find(code: string): ManualCreditRecord | undefined;
  save(item: ManualCreditRecord): void;
  remove(code: string): boolean;
  list(): ManualCreditRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualCreditRecordStore implements ManualCreditRecordStore {
  items: Map<string, ManualCreditRecord>;
  order: string[];

  constructor(items: Map<string, ManualCreditRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualCreditRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualCreditRecord): void {
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

  list(): ManualCreditRecord[] {
    const out: ManualCreditRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualCreditRecordStore(): ManualCreditRecordStore {
  return new MemoryManualCreditRecordStore(new Map<string, ManualCreditRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualCreditRecordStore implements ManualCreditRecordStore {
  inner: ManualCreditRecordStore;
  cache: cache.TtlCache<ManualCreditRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualCreditRecordStore,
    cacheValue: cache.TtlCache<ManualCreditRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualCreditRecord | undefined {
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

  save(item: ManualCreditRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualCreditRecord[] {
    return this.inner.list();
  }
}

export function newCachedManualCreditRecordStore(inner: ManualCreditRecordStore, ttl: number, clockValue: clock.Clock): ManualCreditRecordStore {
  return new CachedManualCreditRecordStore(inner, cache.newTtlCache<ManualCreditRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects manual credit records. Empty fields match all. */
export class ManualCreditRecordQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualCreditRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualCreditRecord[]): ManualCreditRecord[] {
    const matched = collections.filter(items, (candidate: ManualCreditRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualCreditRecords(store: ManualCreditRecordStore, query: ManualCreditRecordQuery): ManualCreditRecord[] {
  return query.apply(store.list());
}
