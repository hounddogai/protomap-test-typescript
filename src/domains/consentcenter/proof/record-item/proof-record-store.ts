import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ProofRecord } from "./proof-record.js";

/** Keeps proof records by code. */
export interface ProofRecordStore {
  find(code: string): ProofRecord | undefined;
  save(item: ProofRecord): void;
  remove(code: string): boolean;
  list(): ProofRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryProofRecordStore implements ProofRecordStore {
  items: Map<string, ProofRecord>;
  order: string[];

  constructor(items: Map<string, ProofRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ProofRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ProofRecord): void {
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

  list(): ProofRecord[] {
    const out: ProofRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryProofRecordStore(): ProofRecordStore {
  return new MemoryProofRecordStore(new Map<string, ProofRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedProofRecordStore implements ProofRecordStore {
  inner: ProofRecordStore;
  cache: cache.TtlCache<ProofRecord>;
  hits: number;
  misses: number;

  constructor(inner: ProofRecordStore, cacheValue: cache.TtlCache<ProofRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ProofRecord | undefined {
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

  save(item: ProofRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ProofRecord[] {
    return this.inner.list();
  }
}

export function newCachedProofRecordStore(inner: ProofRecordStore, ttl: number, clockValue: clock.Clock): ProofRecordStore {
  return new CachedProofRecordStore(inner, cache.newTtlCache<ProofRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects proof records. Empty fields match all. */
export class ProofRecordQuery {
  country: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.country = country;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ProofRecord): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ProofRecord[]): ProofRecord[] {
    const matched = collections.filter(items, (candidate: ProofRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findProofRecords(store: ProofRecordStore, query: ProofRecordQuery): ProofRecord[] {
  return query.apply(store.list());
}
