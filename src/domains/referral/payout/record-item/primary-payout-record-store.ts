import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPayoutRecord } from "./primary-payout-record.js";

/** Keeps primary payout records by code. */
export interface PrimaryPayoutRecordStore {
  find(code: string): PrimaryPayoutRecord | undefined;
  save(item: PrimaryPayoutRecord): void;
  remove(code: string): boolean;
  list(): PrimaryPayoutRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPayoutRecordStore implements PrimaryPayoutRecordStore {
  items: Map<string, PrimaryPayoutRecord>;
  order: string[];

  constructor(items: Map<string, PrimaryPayoutRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPayoutRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPayoutRecord): void {
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

  list(): PrimaryPayoutRecord[] {
    const out: PrimaryPayoutRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPayoutRecordStore(): PrimaryPayoutRecordStore {
  return new MemoryPrimaryPayoutRecordStore(new Map<string, PrimaryPayoutRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPayoutRecordStore implements PrimaryPayoutRecordStore {
  inner: PrimaryPayoutRecordStore;
  cache: cache.TtlCache<PrimaryPayoutRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPayoutRecordStore,
    cacheValue: cache.TtlCache<PrimaryPayoutRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPayoutRecord | undefined {
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

  save(item: PrimaryPayoutRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPayoutRecord[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPayoutRecordStore(inner: PrimaryPayoutRecordStore, ttl: number, clockValue: clock.Clock): PrimaryPayoutRecordStore {
  return new CachedPrimaryPayoutRecordStore(inner, cache.newTtlCache<PrimaryPayoutRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects primary payout records. Empty fields match all. */
export class PrimaryPayoutRecordQuery {
  channel: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minEndsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPayoutRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPayoutRecord[]): PrimaryPayoutRecord[] {
    const matched = collections.filter(items, (candidate: PrimaryPayoutRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPayoutRecords(store: PrimaryPayoutRecordStore, query: PrimaryPayoutRecordQuery): PrimaryPayoutRecord[] {
  return query.apply(store.list());
}
