import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionRecord } from "./suppression-record.js";

/** Keeps suppression records by code. */
export interface SuppressionRecordStore {
  find(code: string): SuppressionRecord | undefined;
  save(item: SuppressionRecord): void;
  remove(code: string): boolean;
  list(): SuppressionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionRecordStore implements SuppressionRecordStore {
  items: Map<string, SuppressionRecord>;
  order: string[];

  constructor(items: Map<string, SuppressionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionRecord): void {
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

  list(): SuppressionRecord[] {
    const out: SuppressionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionRecordStore(): SuppressionRecordStore {
  return new MemorySuppressionRecordStore(new Map<string, SuppressionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionRecordStore implements SuppressionRecordStore {
  inner: SuppressionRecordStore;
  cache: cache.TtlCache<SuppressionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionRecordStore,
    cacheValue: cache.TtlCache<SuppressionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionRecord | undefined {
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

  save(item: SuppressionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionRecord[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionRecordStore(inner: SuppressionRecordStore, ttl: number, clockValue: clock.Clock): SuppressionRecordStore {
  return new CachedSuppressionRecordStore(inner, cache.newTtlCache<SuppressionRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects suppression records. Empty fields match all. */
export class SuppressionRecordQuery {
  title: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minQuantity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionRecord): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionRecord[]): SuppressionRecord[] {
    const matched = collections.filter(items, (candidate: SuppressionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionRecords(store: SuppressionRecordStore, query: SuppressionRecordQuery): SuppressionRecord[] {
  return query.apply(store.list());
}
