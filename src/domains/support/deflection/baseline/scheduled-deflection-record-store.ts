import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

/** Keeps scheduled deflection records by code. */
export interface ScheduledDeflectionRecordStore {
  find(code: string): ScheduledDeflectionRecord | undefined;
  save(item: ScheduledDeflectionRecord): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionRecordStore implements ScheduledDeflectionRecordStore {
  items: Map<string, ScheduledDeflectionRecord>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionRecord): void {
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

  list(): ScheduledDeflectionRecord[] {
    const out: ScheduledDeflectionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionRecordStore(): ScheduledDeflectionRecordStore {
  return new MemoryScheduledDeflectionRecordStore(new Map<string, ScheduledDeflectionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionRecordStore implements ScheduledDeflectionRecordStore {
  inner: ScheduledDeflectionRecordStore;
  cache: cache.TtlCache<ScheduledDeflectionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionRecordStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionRecord | undefined {
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

  save(item: ScheduledDeflectionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionRecord[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionRecordStore(inner: ScheduledDeflectionRecordStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionRecordStore {
  return new CachedScheduledDeflectionRecordStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionRecord>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection records. Empty fields match all. */
export class ScheduledDeflectionRecordQuery {
  label: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minConversionRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionRecord[]): ScheduledDeflectionRecord[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionRecords(store: ScheduledDeflectionRecordStore, query: ScheduledDeflectionRecordQuery): ScheduledDeflectionRecord[] {
  return query.apply(store.list());
}
