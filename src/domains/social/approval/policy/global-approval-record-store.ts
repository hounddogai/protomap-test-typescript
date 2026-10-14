import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalApprovalRecord } from "./global-approval-record.js";

/** Keeps global approval records by code. */
export interface GlobalApprovalRecordStore {
  find(code: string): GlobalApprovalRecord | undefined;
  save(item: GlobalApprovalRecord): void;
  remove(code: string): boolean;
  list(): GlobalApprovalRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalApprovalRecordStore implements GlobalApprovalRecordStore {
  items: Map<string, GlobalApprovalRecord>;
  order: string[];

  constructor(items: Map<string, GlobalApprovalRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalApprovalRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalApprovalRecord): void {
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

  list(): GlobalApprovalRecord[] {
    const out: GlobalApprovalRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalApprovalRecordStore(): GlobalApprovalRecordStore {
  return new MemoryGlobalApprovalRecordStore(new Map<string, GlobalApprovalRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalApprovalRecordStore implements GlobalApprovalRecordStore {
  inner: GlobalApprovalRecordStore;
  cache: cache.TtlCache<GlobalApprovalRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalApprovalRecordStore,
    cacheValue: cache.TtlCache<GlobalApprovalRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalApprovalRecord | undefined {
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

  save(item: GlobalApprovalRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalApprovalRecord[] {
    return this.inner.list();
  }
}

export function newCachedGlobalApprovalRecordStore(inner: GlobalApprovalRecordStore, ttl: number, clockValue: clock.Clock): GlobalApprovalRecordStore {
  return new CachedGlobalApprovalRecordStore(
    inner,
    cache.newTtlCache<GlobalApprovalRecord>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global approval records. Empty fields match all. */
export class GlobalApprovalRecordQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalApprovalRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalApprovalRecord[]): GlobalApprovalRecord[] {
    const matched = collections.filter(items, (candidate: GlobalApprovalRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalApprovalRecords(store: GlobalApprovalRecordStore, query: GlobalApprovalRecordQuery): GlobalApprovalRecord[] {
  return query.apply(store.list());
}
