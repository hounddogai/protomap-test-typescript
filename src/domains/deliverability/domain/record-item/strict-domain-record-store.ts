import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictDomainRecord } from "./strict-domain-record.js";

/** Keeps strict domain records by code. */
export interface StrictDomainRecordStore {
  find(code: string): StrictDomainRecord | undefined;
  save(item: StrictDomainRecord): void;
  remove(code: string): boolean;
  list(): StrictDomainRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictDomainRecordStore implements StrictDomainRecordStore {
  items: Map<string, StrictDomainRecord>;
  order: string[];

  constructor(items: Map<string, StrictDomainRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictDomainRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictDomainRecord): void {
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

  list(): StrictDomainRecord[] {
    const out: StrictDomainRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictDomainRecordStore(): StrictDomainRecordStore {
  return new MemoryStrictDomainRecordStore(new Map<string, StrictDomainRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictDomainRecordStore implements StrictDomainRecordStore {
  inner: StrictDomainRecordStore;
  cache: cache.TtlCache<StrictDomainRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictDomainRecordStore,
    cacheValue: cache.TtlCache<StrictDomainRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictDomainRecord | undefined {
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

  save(item: StrictDomainRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictDomainRecord[] {
    return this.inner.list();
  }
}

export function newCachedStrictDomainRecordStore(inner: StrictDomainRecordStore, ttl: number, clockValue: clock.Clock): StrictDomainRecordStore {
  return new CachedStrictDomainRecordStore(inner, cache.newTtlCache<StrictDomainRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects strict domain records. Empty fields match all. */
export class StrictDomainRecordQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictDomainRecord): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictDomainRecord[]): StrictDomainRecord[] {
    const matched = collections.filter(items, (candidate: StrictDomainRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictDomainRecords(store: StrictDomainRecordStore, query: StrictDomainRecordQuery): StrictDomainRecord[] {
  return query.apply(store.list());
}
