import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditRecord } from "./credit-record.js";

/** Keeps credit records by code. */
export interface CreditRecordStore {
  find(code: string): CreditRecord | undefined;
  save(item: CreditRecord): void;
  remove(code: string): boolean;
  list(): CreditRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditRecordStore implements CreditRecordStore {
  items: Map<string, CreditRecord>;
  order: string[];

  constructor(items: Map<string, CreditRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditRecord): void {
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

  list(): CreditRecord[] {
    const out: CreditRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditRecordStore(): CreditRecordStore {
  return new MemoryCreditRecordStore(new Map<string, CreditRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditRecordStore implements CreditRecordStore {
  inner: CreditRecordStore;
  cache: cache.TtlCache<CreditRecord>;
  hits: number;
  misses: number;

  constructor(inner: CreditRecordStore, cacheValue: cache.TtlCache<CreditRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditRecord | undefined {
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

  save(item: CreditRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditRecord[] {
    return this.inner.list();
  }
}

export function newCachedCreditRecordStore(inner: CreditRecordStore, ttl: number, clockValue: clock.Clock): CreditRecordStore {
  return new CachedCreditRecordStore(inner, cache.newTtlCache<CreditRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects credit records. Empty fields match all. */
export class CreditRecordQuery {
  category: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minQuantity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditRecord): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditRecord[]): CreditRecord[] {
    const matched = collections.filter(items, (candidate: CreditRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditRecords(store: CreditRecordStore, query: CreditRecordQuery): CreditRecord[] {
  return query.apply(store.list());
}
