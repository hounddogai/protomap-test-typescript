import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalFlightRecord } from "./seasonal-flight-record.js";

/** Keeps seasonal flight records by code. */
export interface SeasonalFlightRecordStore {
  find(code: string): SeasonalFlightRecord | undefined;
  save(item: SeasonalFlightRecord): void;
  remove(code: string): boolean;
  list(): SeasonalFlightRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalFlightRecordStore implements SeasonalFlightRecordStore {
  items: Map<string, SeasonalFlightRecord>;
  order: string[];

  constructor(items: Map<string, SeasonalFlightRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalFlightRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalFlightRecord): void {
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

  list(): SeasonalFlightRecord[] {
    const out: SeasonalFlightRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalFlightRecordStore(): SeasonalFlightRecordStore {
  return new MemorySeasonalFlightRecordStore(new Map<string, SeasonalFlightRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalFlightRecordStore implements SeasonalFlightRecordStore {
  inner: SeasonalFlightRecordStore;
  cache: cache.TtlCache<SeasonalFlightRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalFlightRecordStore,
    cacheValue: cache.TtlCache<SeasonalFlightRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalFlightRecord | undefined {
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

  save(item: SeasonalFlightRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalFlightRecord[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalFlightRecordStore(inner: SeasonalFlightRecordStore, ttl: number, clockValue: clock.Clock): SeasonalFlightRecordStore {
  return new CachedSeasonalFlightRecordStore(
    inner,
    cache.newTtlCache<SeasonalFlightRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal flight records. Empty fields match all. */
export class SeasonalFlightRecordQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalFlightRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalFlightRecord[]): SeasonalFlightRecord[] {
    const matched = collections.filter(items, (candidate: SeasonalFlightRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalFlightRecords(store: SeasonalFlightRecordStore, query: SeasonalFlightRecordQuery): SeasonalFlightRecord[] {
  return query.apply(store.list());
}
