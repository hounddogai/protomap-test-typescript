import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPathRecord } from "./pending-path-record.js";

/** Keeps pending path records by code. */
export interface PendingPathRecordStore {
  find(code: string): PendingPathRecord | undefined;
  save(item: PendingPathRecord): void;
  remove(code: string): boolean;
  list(): PendingPathRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPathRecordStore implements PendingPathRecordStore {
  items: Map<string, PendingPathRecord>;
  order: string[];

  constructor(items: Map<string, PendingPathRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPathRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPathRecord): void {
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

  list(): PendingPathRecord[] {
    const out: PendingPathRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPathRecordStore(): PendingPathRecordStore {
  return new MemoryPendingPathRecordStore(new Map<string, PendingPathRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPathRecordStore implements PendingPathRecordStore {
  inner: PendingPathRecordStore;
  cache: cache.TtlCache<PendingPathRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPathRecordStore,
    cacheValue: cache.TtlCache<PendingPathRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPathRecord | undefined {
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

  save(item: PendingPathRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPathRecord[] {
    return this.inner.list();
  }
}

export function newCachedPendingPathRecordStore(inner: PendingPathRecordStore, ttl: number, clockValue: clock.Clock): PendingPathRecordStore {
  return new CachedPendingPathRecordStore(inner, cache.newTtlCache<PendingPathRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects pending path records. Empty fields match all. */
export class PendingPathRecordQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPathRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPathRecord[]): PendingPathRecord[] {
    const matched = collections.filter(items, (candidate: PendingPathRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPathRecords(store: PendingPathRecordStore, query: PendingPathRecordQuery): PendingPathRecord[] {
  return query.apply(store.list());
}
