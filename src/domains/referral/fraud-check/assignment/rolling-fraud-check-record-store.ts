import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFraudCheckRecord } from "./rolling-fraud-check-record.js";

/** Keeps rolling fraud check records by code. */
export interface RollingFraudCheckRecordStore {
  find(code: string): RollingFraudCheckRecord | undefined;
  save(item: RollingFraudCheckRecord): void;
  remove(code: string): boolean;
  list(): RollingFraudCheckRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFraudCheckRecordStore implements RollingFraudCheckRecordStore {
  items: Map<string, RollingFraudCheckRecord>;
  order: string[];

  constructor(items: Map<string, RollingFraudCheckRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFraudCheckRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFraudCheckRecord): void {
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

  list(): RollingFraudCheckRecord[] {
    const out: RollingFraudCheckRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFraudCheckRecordStore(): RollingFraudCheckRecordStore {
  return new MemoryRollingFraudCheckRecordStore(new Map<string, RollingFraudCheckRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFraudCheckRecordStore implements RollingFraudCheckRecordStore {
  inner: RollingFraudCheckRecordStore;
  cache: cache.TtlCache<RollingFraudCheckRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFraudCheckRecordStore,
    cacheValue: cache.TtlCache<RollingFraudCheckRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFraudCheckRecord | undefined {
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

  save(item: RollingFraudCheckRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFraudCheckRecord[] {
    return this.inner.list();
  }
}

export function newCachedRollingFraudCheckRecordStore(inner: RollingFraudCheckRecordStore, ttl: number, clockValue: clock.Clock): RollingFraudCheckRecordStore {
  return new CachedRollingFraudCheckRecordStore(
    inner,
    cache.newTtlCache<RollingFraudCheckRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling fraud check records. Empty fields match all. */
export class RollingFraudCheckRecordQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFraudCheckRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFraudCheckRecord[]): RollingFraudCheckRecord[] {
    const matched = collections.filter(items, (candidate: RollingFraudCheckRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFraudCheckRecords(store: RollingFraudCheckRecordStore, query: RollingFraudCheckRecordQuery): RollingFraudCheckRecord[] {
  return query.apply(store.list());
}
