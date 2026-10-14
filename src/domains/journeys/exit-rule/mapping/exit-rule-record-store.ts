import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleRecord } from "./exit-rule-record.js";

/** Keeps exit rule records by code. */
export interface ExitRuleRecordStore {
  find(code: string): ExitRuleRecord | undefined;
  save(item: ExitRuleRecord): void;
  remove(code: string): boolean;
  list(): ExitRuleRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleRecordStore implements ExitRuleRecordStore {
  items: Map<string, ExitRuleRecord>;
  order: string[];

  constructor(items: Map<string, ExitRuleRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleRecord): void {
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

  list(): ExitRuleRecord[] {
    const out: ExitRuleRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleRecordStore(): ExitRuleRecordStore {
  return new MemoryExitRuleRecordStore(new Map<string, ExitRuleRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleRecordStore implements ExitRuleRecordStore {
  inner: ExitRuleRecordStore;
  cache: cache.TtlCache<ExitRuleRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleRecordStore,
    cacheValue: cache.TtlCache<ExitRuleRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleRecord | undefined {
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

  save(item: ExitRuleRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleRecord[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleRecordStore(inner: ExitRuleRecordStore, ttl: number, clockValue: clock.Clock): ExitRuleRecordStore {
  return new CachedExitRuleRecordStore(inner, cache.newTtlCache<ExitRuleRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects exit rule records. Empty fields match all. */
export class ExitRuleRecordQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleRecord[]): ExitRuleRecord[] {
    const matched = collections.filter(items, (candidate: ExitRuleRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleRecords(store: ExitRuleRecordStore, query: ExitRuleRecordQuery): ExitRuleRecord[] {
  return query.apply(store.list());
}
