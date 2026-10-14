import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualStepRecord } from "./manual-step-record.js";

/** Keeps manual step records by code. */
export interface ManualStepRecordStore {
  find(code: string): ManualStepRecord | undefined;
  save(item: ManualStepRecord): void;
  remove(code: string): boolean;
  list(): ManualStepRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualStepRecordStore implements ManualStepRecordStore {
  items: Map<string, ManualStepRecord>;
  order: string[];

  constructor(items: Map<string, ManualStepRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualStepRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualStepRecord): void {
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

  list(): ManualStepRecord[] {
    const out: ManualStepRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualStepRecordStore(): ManualStepRecordStore {
  return new MemoryManualStepRecordStore(new Map<string, ManualStepRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualStepRecordStore implements ManualStepRecordStore {
  inner: ManualStepRecordStore;
  cache: cache.TtlCache<ManualStepRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualStepRecordStore,
    cacheValue: cache.TtlCache<ManualStepRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualStepRecord | undefined {
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

  save(item: ManualStepRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualStepRecord[] {
    return this.inner.list();
  }
}

export function newCachedManualStepRecordStore(inner: ManualStepRecordStore, ttl: number, clockValue: clock.Clock): ManualStepRecordStore {
  return new CachedManualStepRecordStore(inner, cache.newTtlCache<ManualStepRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects manual step records. Empty fields match all. */
export class ManualStepRecordQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualStepRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualStepRecord[]): ManualStepRecord[] {
    const matched = collections.filter(items, (candidate: ManualStepRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualStepRecords(store: ManualStepRecordStore, query: ManualStepRecordQuery): ManualStepRecord[] {
  return query.apply(store.list());
}
