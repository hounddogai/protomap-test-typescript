import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortRecord } from "./cohort-record.js";

/** Keeps cohort records by code. */
export interface CohortRecordStore {
  find(code: string): CohortRecord | undefined;
  save(item: CohortRecord): void;
  remove(code: string): boolean;
  list(): CohortRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortRecordStore implements CohortRecordStore {
  items: Map<string, CohortRecord>;
  order: string[];

  constructor(items: Map<string, CohortRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortRecord): void {
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

  list(): CohortRecord[] {
    const out: CohortRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortRecordStore(): CohortRecordStore {
  return new MemoryCohortRecordStore(new Map<string, CohortRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortRecordStore implements CohortRecordStore {
  inner: CohortRecordStore;
  cache: cache.TtlCache<CohortRecord>;
  hits: number;
  misses: number;

  constructor(inner: CohortRecordStore, cacheValue: cache.TtlCache<CohortRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortRecord | undefined {
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

  save(item: CohortRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortRecord[] {
    return this.inner.list();
  }
}

export function newCachedCohortRecordStore(inner: CohortRecordStore, ttl: number, clockValue: clock.Clock): CohortRecordStore {
  return new CachedCohortRecordStore(inner, cache.newTtlCache<CohortRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects cohort records. Empty fields match all. */
export class CohortRecordQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortRecord[]): CohortRecord[] {
    const matched = collections.filter(items, (candidate: CohortRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortRecords(store: CohortRecordStore, query: CohortRecordQuery): CohortRecord[] {
  return query.apply(store.list());
}
