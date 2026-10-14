import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchRecord } from "./branch-record.js";

/** Keeps branch records by code. */
export interface BranchRecordStore {
  find(code: string): BranchRecord | undefined;
  save(item: BranchRecord): void;
  remove(code: string): boolean;
  list(): BranchRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchRecordStore implements BranchRecordStore {
  items: Map<string, BranchRecord>;
  order: string[];

  constructor(items: Map<string, BranchRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchRecord): void {
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

  list(): BranchRecord[] {
    const out: BranchRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchRecordStore(): BranchRecordStore {
  return new MemoryBranchRecordStore(new Map<string, BranchRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchRecordStore implements BranchRecordStore {
  inner: BranchRecordStore;
  cache: cache.TtlCache<BranchRecord>;
  hits: number;
  misses: number;

  constructor(inner: BranchRecordStore, cacheValue: cache.TtlCache<BranchRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchRecord | undefined {
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

  save(item: BranchRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchRecord[] {
    return this.inner.list();
  }
}

export function newCachedBranchRecordStore(inner: BranchRecordStore, ttl: number, clockValue: clock.Clock): BranchRecordStore {
  return new CachedBranchRecordStore(inner, cache.newTtlCache<BranchRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects branch records. Empty fields match all. */
export class BranchRecordQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchRecord[]): BranchRecord[] {
    const matched = collections.filter(items, (candidate: BranchRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchRecords(store: BranchRecordStore, query: BranchRecordQuery): BranchRecord[] {
  return query.apply(store.list());
}
