import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedSuppressionRecord } from "./capped-suppression-record.js";

/** Keeps capped suppression records by code. */
export interface CappedSuppressionRecordStore {
  find(code: string): CappedSuppressionRecord | undefined;
  save(item: CappedSuppressionRecord): void;
  remove(code: string): boolean;
  list(): CappedSuppressionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedSuppressionRecordStore implements CappedSuppressionRecordStore {
  items: Map<string, CappedSuppressionRecord>;
  order: string[];

  constructor(items: Map<string, CappedSuppressionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedSuppressionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedSuppressionRecord): void {
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

  list(): CappedSuppressionRecord[] {
    const out: CappedSuppressionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedSuppressionRecordStore(): CappedSuppressionRecordStore {
  return new MemoryCappedSuppressionRecordStore(new Map<string, CappedSuppressionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedSuppressionRecordStore implements CappedSuppressionRecordStore {
  inner: CappedSuppressionRecordStore;
  cache: cache.TtlCache<CappedSuppressionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedSuppressionRecordStore,
    cacheValue: cache.TtlCache<CappedSuppressionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedSuppressionRecord | undefined {
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

  save(item: CappedSuppressionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedSuppressionRecord[] {
    return this.inner.list();
  }
}

export function newCachedCappedSuppressionRecordStore(inner: CappedSuppressionRecordStore, ttl: number, clockValue: clock.Clock): CappedSuppressionRecordStore {
  return new CachedCappedSuppressionRecordStore(
    inner,
    cache.newTtlCache<CappedSuppressionRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped suppression records. Empty fields match all. */
export class CappedSuppressionRecordQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedSuppressionRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedSuppressionRecord[]): CappedSuppressionRecord[] {
    const matched = collections.filter(items, (candidate: CappedSuppressionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedSuppressionRecords(store: CappedSuppressionRecordStore, query: CappedSuppressionRecordQuery): CappedSuppressionRecord[] {
  return query.apply(store.list());
}
