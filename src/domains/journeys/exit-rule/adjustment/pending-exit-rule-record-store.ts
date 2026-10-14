import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingExitRuleRecord } from "./pending-exit-rule-record.js";

/** Keeps pending exit rule records by code. */
export interface PendingExitRuleRecordStore {
  find(code: string): PendingExitRuleRecord | undefined;
  save(item: PendingExitRuleRecord): void;
  remove(code: string): boolean;
  list(): PendingExitRuleRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingExitRuleRecordStore implements PendingExitRuleRecordStore {
  items: Map<string, PendingExitRuleRecord>;
  order: string[];

  constructor(items: Map<string, PendingExitRuleRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingExitRuleRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingExitRuleRecord): void {
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

  list(): PendingExitRuleRecord[] {
    const out: PendingExitRuleRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingExitRuleRecordStore(): PendingExitRuleRecordStore {
  return new MemoryPendingExitRuleRecordStore(new Map<string, PendingExitRuleRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingExitRuleRecordStore implements PendingExitRuleRecordStore {
  inner: PendingExitRuleRecordStore;
  cache: cache.TtlCache<PendingExitRuleRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingExitRuleRecordStore,
    cacheValue: cache.TtlCache<PendingExitRuleRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingExitRuleRecord | undefined {
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

  save(item: PendingExitRuleRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingExitRuleRecord[] {
    return this.inner.list();
  }
}

export function newCachedPendingExitRuleRecordStore(inner: PendingExitRuleRecordStore, ttl: number, clockValue: clock.Clock): PendingExitRuleRecordStore {
  return new CachedPendingExitRuleRecordStore(
    inner,
    cache.newTtlCache<PendingExitRuleRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending exit rule records. Empty fields match all. */
export class PendingExitRuleRecordQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingExitRuleRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingExitRuleRecord[]): PendingExitRuleRecord[] {
    const matched = collections.filter(items, (candidate: PendingExitRuleRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingExitRuleRecords(store: PendingExitRuleRecordStore, query: PendingExitRuleRecordQuery): PendingExitRuleRecord[] {
  return query.apply(store.list());
}
