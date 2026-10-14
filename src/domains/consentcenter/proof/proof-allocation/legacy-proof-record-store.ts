import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyProofRecord } from "./legacy-proof-record.js";

/** Keeps legacy proof records by code. */
export interface LegacyProofRecordStore {
  find(code: string): LegacyProofRecord | undefined;
  save(item: LegacyProofRecord): void;
  remove(code: string): boolean;
  list(): LegacyProofRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyProofRecordStore implements LegacyProofRecordStore {
  items: Map<string, LegacyProofRecord>;
  order: string[];

  constructor(items: Map<string, LegacyProofRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyProofRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyProofRecord): void {
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

  list(): LegacyProofRecord[] {
    const out: LegacyProofRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyProofRecordStore(): LegacyProofRecordStore {
  return new MemoryLegacyProofRecordStore(new Map<string, LegacyProofRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyProofRecordStore implements LegacyProofRecordStore {
  inner: LegacyProofRecordStore;
  cache: cache.TtlCache<LegacyProofRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyProofRecordStore,
    cacheValue: cache.TtlCache<LegacyProofRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyProofRecord | undefined {
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

  save(item: LegacyProofRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyProofRecord[] {
    return this.inner.list();
  }
}

export function newCachedLegacyProofRecordStore(inner: LegacyProofRecordStore, ttl: number, clockValue: clock.Clock): LegacyProofRecordStore {
  return new CachedLegacyProofRecordStore(inner, cache.newTtlCache<LegacyProofRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects legacy proof records. Empty fields match all. */
export class LegacyProofRecordQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyProofRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyProofRecord[]): LegacyProofRecord[] {
    const matched = collections.filter(items, (candidate: LegacyProofRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyProofRecords(store: LegacyProofRecordStore, query: LegacyProofRecordQuery): LegacyProofRecord[] {
  return query.apply(store.list());
}
