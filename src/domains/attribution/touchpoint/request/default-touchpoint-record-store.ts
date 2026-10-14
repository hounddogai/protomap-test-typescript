import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultTouchpointRecord } from "./default-touchpoint-record.js";

/** Keeps default touchpoint records by code. */
export interface DefaultTouchpointRecordStore {
  find(code: string): DefaultTouchpointRecord | undefined;
  save(item: DefaultTouchpointRecord): void;
  remove(code: string): boolean;
  list(): DefaultTouchpointRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultTouchpointRecordStore implements DefaultTouchpointRecordStore {
  items: Map<string, DefaultTouchpointRecord>;
  order: string[];

  constructor(items: Map<string, DefaultTouchpointRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultTouchpointRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultTouchpointRecord): void {
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

  list(): DefaultTouchpointRecord[] {
    const out: DefaultTouchpointRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultTouchpointRecordStore(): DefaultTouchpointRecordStore {
  return new MemoryDefaultTouchpointRecordStore(new Map<string, DefaultTouchpointRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultTouchpointRecordStore implements DefaultTouchpointRecordStore {
  inner: DefaultTouchpointRecordStore;
  cache: cache.TtlCache<DefaultTouchpointRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultTouchpointRecordStore,
    cacheValue: cache.TtlCache<DefaultTouchpointRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultTouchpointRecord | undefined {
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

  save(item: DefaultTouchpointRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultTouchpointRecord[] {
    return this.inner.list();
  }
}

export function newCachedDefaultTouchpointRecordStore(inner: DefaultTouchpointRecordStore, ttl: number, clockValue: clock.Clock): DefaultTouchpointRecordStore {
  return new CachedDefaultTouchpointRecordStore(
    inner,
    cache.newTtlCache<DefaultTouchpointRecord>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default touchpoint records. Empty fields match all. */
export class DefaultTouchpointRecordQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultTouchpointRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultTouchpointRecord[]): DefaultTouchpointRecord[] {
    const matched = collections.filter(items, (candidate: DefaultTouchpointRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultTouchpointRecords(store: DefaultTouchpointRecordStore, query: DefaultTouchpointRecordQuery): DefaultTouchpointRecord[] {
  return query.apply(store.list());
}
