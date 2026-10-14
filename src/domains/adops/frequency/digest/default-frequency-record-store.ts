import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFrequencyRecord } from "./default-frequency-record.js";

/** Keeps default frequency records by code. */
export interface DefaultFrequencyRecordStore {
  find(code: string): DefaultFrequencyRecord | undefined;
  save(item: DefaultFrequencyRecord): void;
  remove(code: string): boolean;
  list(): DefaultFrequencyRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFrequencyRecordStore implements DefaultFrequencyRecordStore {
  items: Map<string, DefaultFrequencyRecord>;
  order: string[];

  constructor(items: Map<string, DefaultFrequencyRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFrequencyRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFrequencyRecord): void {
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

  list(): DefaultFrequencyRecord[] {
    const out: DefaultFrequencyRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFrequencyRecordStore(): DefaultFrequencyRecordStore {
  return new MemoryDefaultFrequencyRecordStore(new Map<string, DefaultFrequencyRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFrequencyRecordStore implements DefaultFrequencyRecordStore {
  inner: DefaultFrequencyRecordStore;
  cache: cache.TtlCache<DefaultFrequencyRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFrequencyRecordStore,
    cacheValue: cache.TtlCache<DefaultFrequencyRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFrequencyRecord | undefined {
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

  save(item: DefaultFrequencyRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFrequencyRecord[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFrequencyRecordStore(inner: DefaultFrequencyRecordStore, ttl: number, clockValue: clock.Clock): DefaultFrequencyRecordStore {
  return new CachedDefaultFrequencyRecordStore(
    inner,
    cache.newTtlCache<DefaultFrequencyRecord>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default frequency records. Empty fields match all. */
export class DefaultFrequencyRecordQuery {
  utmSource: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minVersion: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFrequencyRecord): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFrequencyRecord[]): DefaultFrequencyRecord[] {
    const matched = collections.filter(items, (candidate: DefaultFrequencyRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFrequencyRecords(store: DefaultFrequencyRecordStore, query: DefaultFrequencyRecordQuery): DefaultFrequencyRecord[] {
  return query.apply(store.list());
}
