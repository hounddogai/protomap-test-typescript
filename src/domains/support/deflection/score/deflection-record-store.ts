import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionRecord } from "./deflection-record.js";

/** Keeps deflection records by code. */
export interface DeflectionRecordStore {
  find(code: string): DeflectionRecord | undefined;
  save(item: DeflectionRecord): void;
  remove(code: string): boolean;
  list(): DeflectionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionRecordStore implements DeflectionRecordStore {
  items: Map<string, DeflectionRecord>;
  order: string[];

  constructor(items: Map<string, DeflectionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionRecord): void {
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

  list(): DeflectionRecord[] {
    const out: DeflectionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionRecordStore(): DeflectionRecordStore {
  return new MemoryDeflectionRecordStore(new Map<string, DeflectionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionRecordStore implements DeflectionRecordStore {
  inner: DeflectionRecordStore;
  cache: cache.TtlCache<DeflectionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionRecordStore,
    cacheValue: cache.TtlCache<DeflectionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionRecord | undefined {
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

  save(item: DeflectionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionRecord[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionRecordStore(inner: DeflectionRecordStore, ttl: number, clockValue: clock.Clock): DeflectionRecordStore {
  return new CachedDeflectionRecordStore(inner, cache.newTtlCache<DeflectionRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects deflection records. Empty fields match all. */
export class DeflectionRecordQuery {
  country: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minQuantity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionRecord): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionRecord[]): DeflectionRecord[] {
    const matched = collections.filter(items, (candidate: DeflectionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionRecords(store: DeflectionRecordStore, query: DeflectionRecordQuery): DeflectionRecord[] {
  return query.apply(store.list());
}
