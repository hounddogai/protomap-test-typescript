import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryFunnelRecord } from "./primary-funnel-record.js";

/** Keeps primary funnel records by code. */
export interface PrimaryFunnelRecordStore {
  find(code: string): PrimaryFunnelRecord | undefined;
  save(item: PrimaryFunnelRecord): void;
  remove(code: string): boolean;
  list(): PrimaryFunnelRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryFunnelRecordStore implements PrimaryFunnelRecordStore {
  items: Map<string, PrimaryFunnelRecord>;
  order: string[];

  constructor(items: Map<string, PrimaryFunnelRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryFunnelRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryFunnelRecord): void {
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

  list(): PrimaryFunnelRecord[] {
    const out: PrimaryFunnelRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryFunnelRecordStore(): PrimaryFunnelRecordStore {
  return new MemoryPrimaryFunnelRecordStore(new Map<string, PrimaryFunnelRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryFunnelRecordStore implements PrimaryFunnelRecordStore {
  inner: PrimaryFunnelRecordStore;
  cache: cache.TtlCache<PrimaryFunnelRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryFunnelRecordStore,
    cacheValue: cache.TtlCache<PrimaryFunnelRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryFunnelRecord | undefined {
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

  save(item: PrimaryFunnelRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryFunnelRecord[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryFunnelRecordStore(inner: PrimaryFunnelRecordStore, ttl: number, clockValue: clock.Clock): PrimaryFunnelRecordStore {
  return new CachedPrimaryFunnelRecordStore(inner, cache.newTtlCache<PrimaryFunnelRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects primary funnel records. Empty fields match all. */
export class PrimaryFunnelRecordQuery {
  channel: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minClicks: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryFunnelRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryFunnelRecord[]): PrimaryFunnelRecord[] {
    const matched = collections.filter(items, (candidate: PrimaryFunnelRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryFunnelRecords(store: PrimaryFunnelRecordStore, query: PrimaryFunnelRecordQuery): PrimaryFunnelRecord[] {
  return query.apply(store.list());
}
