import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelRecord } from "./funnel-record.js";

/** Keeps funnel records by code. */
export interface FunnelRecordStore {
  find(code: string): FunnelRecord | undefined;
  save(item: FunnelRecord): void;
  remove(code: string): boolean;
  list(): FunnelRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelRecordStore implements FunnelRecordStore {
  items: Map<string, FunnelRecord>;
  order: string[];

  constructor(items: Map<string, FunnelRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelRecord): void {
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

  list(): FunnelRecord[] {
    const out: FunnelRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelRecordStore(): FunnelRecordStore {
  return new MemoryFunnelRecordStore(new Map<string, FunnelRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelRecordStore implements FunnelRecordStore {
  inner: FunnelRecordStore;
  cache: cache.TtlCache<FunnelRecord>;
  hits: number;
  misses: number;

  constructor(inner: FunnelRecordStore, cacheValue: cache.TtlCache<FunnelRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelRecord | undefined {
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

  save(item: FunnelRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelRecord[] {
    return this.inner.list();
  }
}

export function newCachedFunnelRecordStore(inner: FunnelRecordStore, ttl: number, clockValue: clock.Clock): FunnelRecordStore {
  return new CachedFunnelRecordStore(inner, cache.newTtlCache<FunnelRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects funnel records. Empty fields match all. */
export class FunnelRecordQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelRecord[]): FunnelRecord[] {
    const matched = collections.filter(items, (candidate: FunnelRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelRecords(store: FunnelRecordStore, query: FunnelRecordQuery): FunnelRecord[] {
  return query.apply(store.list());
}
