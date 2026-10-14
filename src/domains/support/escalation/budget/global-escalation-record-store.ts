import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalEscalationRecord } from "./global-escalation-record.js";

/** Keeps global escalation records by code. */
export interface GlobalEscalationRecordStore {
  find(code: string): GlobalEscalationRecord | undefined;
  save(item: GlobalEscalationRecord): void;
  remove(code: string): boolean;
  list(): GlobalEscalationRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalEscalationRecordStore implements GlobalEscalationRecordStore {
  items: Map<string, GlobalEscalationRecord>;
  order: string[];

  constructor(items: Map<string, GlobalEscalationRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalEscalationRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalEscalationRecord): void {
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

  list(): GlobalEscalationRecord[] {
    const out: GlobalEscalationRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalEscalationRecordStore(): GlobalEscalationRecordStore {
  return new MemoryGlobalEscalationRecordStore(new Map<string, GlobalEscalationRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalEscalationRecordStore implements GlobalEscalationRecordStore {
  inner: GlobalEscalationRecordStore;
  cache: cache.TtlCache<GlobalEscalationRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalEscalationRecordStore,
    cacheValue: cache.TtlCache<GlobalEscalationRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalEscalationRecord | undefined {
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

  save(item: GlobalEscalationRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalEscalationRecord[] {
    return this.inner.list();
  }
}

export function newCachedGlobalEscalationRecordStore(inner: GlobalEscalationRecordStore, ttl: number, clockValue: clock.Clock): GlobalEscalationRecordStore {
  return new CachedGlobalEscalationRecordStore(
    inner,
    cache.newTtlCache<GlobalEscalationRecord>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global escalation records. Empty fields match all. */
export class GlobalEscalationRecordQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalEscalationRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalEscalationRecord[]): GlobalEscalationRecord[] {
    const matched = collections.filter(items, (candidate: GlobalEscalationRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalEscalationRecords(store: GlobalEscalationRecordStore, query: GlobalEscalationRecordQuery): GlobalEscalationRecord[] {
  return query.apply(store.list());
}
