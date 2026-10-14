import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneyRecord } from "./journey-record.js";

/** Keeps journey records by code. */
export interface JourneyRecordStore {
  find(code: string): JourneyRecord | undefined;
  save(item: JourneyRecord): void;
  remove(code: string): boolean;
  list(): JourneyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneyRecordStore implements JourneyRecordStore {
  items: Map<string, JourneyRecord>;
  order: string[];

  constructor(items: Map<string, JourneyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneyRecord): void {
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

  list(): JourneyRecord[] {
    const out: JourneyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneyRecordStore(): JourneyRecordStore {
  return new MemoryJourneyRecordStore(new Map<string, JourneyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneyRecordStore implements JourneyRecordStore {
  inner: JourneyRecordStore;
  cache: cache.TtlCache<JourneyRecord>;
  hits: number;
  misses: number;

  constructor(inner: JourneyRecordStore, cacheValue: cache.TtlCache<JourneyRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneyRecord | undefined {
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

  save(item: JourneyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneyRecord[] {
    return this.inner.list();
  }
}

export function newCachedJourneyRecordStore(inner: JourneyRecordStore, ttl: number, clockValue: clock.Clock): JourneyRecordStore {
  return new CachedJourneyRecordStore(inner, cache.newTtlCache<JourneyRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects journey records. Empty fields match all. */
export class JourneyRecordQuery {
  label: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCapacity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneyRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneyRecord[]): JourneyRecord[] {
    const matched = collections.filter(items, (candidate: JourneyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneyRecords(store: JourneyRecordStore, query: JourneyRecordQuery): JourneyRecord[] {
  return query.apply(store.list());
}
