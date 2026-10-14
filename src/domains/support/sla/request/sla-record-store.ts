import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaRecord } from "./sla-record.js";

/** Keeps sla records by code. */
export interface SlaRecordStore {
  find(code: string): SlaRecord | undefined;
  save(item: SlaRecord): void;
  remove(code: string): boolean;
  list(): SlaRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaRecordStore implements SlaRecordStore {
  items: Map<string, SlaRecord>;
  order: string[];

  constructor(items: Map<string, SlaRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaRecord): void {
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

  list(): SlaRecord[] {
    const out: SlaRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaRecordStore(): SlaRecordStore {
  return new MemorySlaRecordStore(new Map<string, SlaRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaRecordStore implements SlaRecordStore {
  inner: SlaRecordStore;
  cache: cache.TtlCache<SlaRecord>;
  hits: number;
  misses: number;

  constructor(inner: SlaRecordStore, cacheValue: cache.TtlCache<SlaRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaRecord | undefined {
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

  save(item: SlaRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaRecord[] {
    return this.inner.list();
  }
}

export function newCachedSlaRecordStore(inner: SlaRecordStore, ttl: number, clockValue: clock.Clock): SlaRecordStore {
  return new CachedSlaRecordStore(inner, cache.newTtlCache<SlaRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects sla records. Empty fields match all. */
export class SlaRecordQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaRecord[]): SlaRecord[] {
    const matched = collections.filter(items, (candidate: SlaRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaRecords(store: SlaRecordStore, query: SlaRecordQuery): SlaRecord[] {
  return query.apply(store.list());
}
