import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalDeflectionRecord } from "./regional-deflection-record.js";

/** Keeps regional deflection records by code. */
export interface RegionalDeflectionRecordStore {
  find(code: string): RegionalDeflectionRecord | undefined;
  save(item: RegionalDeflectionRecord): void;
  remove(code: string): boolean;
  list(): RegionalDeflectionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalDeflectionRecordStore implements RegionalDeflectionRecordStore {
  items: Map<string, RegionalDeflectionRecord>;
  order: string[];

  constructor(items: Map<string, RegionalDeflectionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalDeflectionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalDeflectionRecord): void {
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

  list(): RegionalDeflectionRecord[] {
    const out: RegionalDeflectionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalDeflectionRecordStore(): RegionalDeflectionRecordStore {
  return new MemoryRegionalDeflectionRecordStore(new Map<string, RegionalDeflectionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalDeflectionRecordStore implements RegionalDeflectionRecordStore {
  inner: RegionalDeflectionRecordStore;
  cache: cache.TtlCache<RegionalDeflectionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalDeflectionRecordStore,
    cacheValue: cache.TtlCache<RegionalDeflectionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalDeflectionRecord | undefined {
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

  save(item: RegionalDeflectionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalDeflectionRecord[] {
    return this.inner.list();
  }
}

export function newCachedRegionalDeflectionRecordStore(inner: RegionalDeflectionRecordStore, ttl: number, clockValue: clock.Clock): RegionalDeflectionRecordStore {
  return new CachedRegionalDeflectionRecordStore(
    inner,
    cache.newTtlCache<RegionalDeflectionRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional deflection records. Empty fields match all. */
export class RegionalDeflectionRecordQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalDeflectionRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalDeflectionRecord[]): RegionalDeflectionRecord[] {
    const matched = collections.filter(items, (candidate: RegionalDeflectionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalDeflectionRecords(store: RegionalDeflectionRecordStore, query: RegionalDeflectionRecordQuery): RegionalDeflectionRecord[] {
  return query.apply(store.list());
}
