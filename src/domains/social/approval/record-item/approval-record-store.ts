import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalRecord } from "./approval-record.js";

/** Keeps approval records by code. */
export interface ApprovalRecordStore {
  find(code: string): ApprovalRecord | undefined;
  save(item: ApprovalRecord): void;
  remove(code: string): boolean;
  list(): ApprovalRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalRecordStore implements ApprovalRecordStore {
  items: Map<string, ApprovalRecord>;
  order: string[];

  constructor(items: Map<string, ApprovalRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalRecord): void {
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

  list(): ApprovalRecord[] {
    const out: ApprovalRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalRecordStore(): ApprovalRecordStore {
  return new MemoryApprovalRecordStore(new Map<string, ApprovalRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalRecordStore implements ApprovalRecordStore {
  inner: ApprovalRecordStore;
  cache: cache.TtlCache<ApprovalRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ApprovalRecordStore,
    cacheValue: cache.TtlCache<ApprovalRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalRecord | undefined {
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

  save(item: ApprovalRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalRecord[] {
    return this.inner.list();
  }
}

export function newCachedApprovalRecordStore(inner: ApprovalRecordStore, ttl: number, clockValue: clock.Clock): ApprovalRecordStore {
  return new CachedApprovalRecordStore(inner, cache.newTtlCache<ApprovalRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects approval records. Empty fields match all. */
export class ApprovalRecordQuery {
  name: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minWeight: number, statuses: string[], limit: number) {
    this.name = name;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalRecord[]): ApprovalRecord[] {
    const matched = collections.filter(items, (candidate: ApprovalRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalRecords(store: ApprovalRecordStore, query: ApprovalRecordQuery): ApprovalRecord[] {
  return query.apply(store.list());
}
