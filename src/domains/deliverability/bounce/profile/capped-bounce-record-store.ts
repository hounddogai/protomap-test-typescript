import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBounceRecord } from "./capped-bounce-record.js";

/** Keeps capped bounce records by code. */
export interface CappedBounceRecordStore {
  find(code: string): CappedBounceRecord | undefined;
  save(item: CappedBounceRecord): void;
  remove(code: string): boolean;
  list(): CappedBounceRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBounceRecordStore implements CappedBounceRecordStore {
  items: Map<string, CappedBounceRecord>;
  order: string[];

  constructor(items: Map<string, CappedBounceRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBounceRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBounceRecord): void {
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

  list(): CappedBounceRecord[] {
    const out: CappedBounceRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBounceRecordStore(): CappedBounceRecordStore {
  return new MemoryCappedBounceRecordStore(new Map<string, CappedBounceRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBounceRecordStore implements CappedBounceRecordStore {
  inner: CappedBounceRecordStore;
  cache: cache.TtlCache<CappedBounceRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBounceRecordStore,
    cacheValue: cache.TtlCache<CappedBounceRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBounceRecord | undefined {
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

  save(item: CappedBounceRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBounceRecord[] {
    return this.inner.list();
  }
}

export function newCachedCappedBounceRecordStore(inner: CappedBounceRecordStore, ttl: number, clockValue: clock.Clock): CappedBounceRecordStore {
  return new CachedCappedBounceRecordStore(inner, cache.newTtlCache<CappedBounceRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped bounce records. Empty fields match all. */
export class CappedBounceRecordQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBounceRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBounceRecord[]): CappedBounceRecord[] {
    const matched = collections.filter(items, (candidate: CappedBounceRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBounceRecords(store: CappedBounceRecordStore, query: CappedBounceRecordQuery): CappedBounceRecord[] {
  return query.apply(store.list());
}
