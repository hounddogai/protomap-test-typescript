import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDomainRecord } from "./scheduled-domain-record.js";

/** Keeps scheduled domain records by code. */
export interface ScheduledDomainRecordStore {
  find(code: string): ScheduledDomainRecord | undefined;
  save(item: ScheduledDomainRecord): void;
  remove(code: string): boolean;
  list(): ScheduledDomainRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDomainRecordStore implements ScheduledDomainRecordStore {
  items: Map<string, ScheduledDomainRecord>;
  order: string[];

  constructor(items: Map<string, ScheduledDomainRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDomainRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDomainRecord): void {
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

  list(): ScheduledDomainRecord[] {
    const out: ScheduledDomainRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDomainRecordStore(): ScheduledDomainRecordStore {
  return new MemoryScheduledDomainRecordStore(new Map<string, ScheduledDomainRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDomainRecordStore implements ScheduledDomainRecordStore {
  inner: ScheduledDomainRecordStore;
  cache: cache.TtlCache<ScheduledDomainRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDomainRecordStore,
    cacheValue: cache.TtlCache<ScheduledDomainRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDomainRecord | undefined {
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

  save(item: ScheduledDomainRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDomainRecord[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDomainRecordStore(inner: ScheduledDomainRecordStore, ttl: number, clockValue: clock.Clock): ScheduledDomainRecordStore {
  return new CachedScheduledDomainRecordStore(
    inner,
    cache.newTtlCache<ScheduledDomainRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled domain records. Empty fields match all. */
export class ScheduledDomainRecordQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDomainRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDomainRecord[]): ScheduledDomainRecord[] {
    const matched = collections.filter(items, (candidate: ScheduledDomainRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDomainRecords(store: ScheduledDomainRecordStore, query: ScheduledDomainRecordQuery): ScheduledDomainRecord[] {
  return query.apply(store.list());
}
