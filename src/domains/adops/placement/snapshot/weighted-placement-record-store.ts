import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPlacementRecord } from "./weighted-placement-record.js";

/** Keeps weighted placement records by code. */
export interface WeightedPlacementRecordStore {
  find(code: string): WeightedPlacementRecord | undefined;
  save(item: WeightedPlacementRecord): void;
  remove(code: string): boolean;
  list(): WeightedPlacementRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPlacementRecordStore implements WeightedPlacementRecordStore {
  items: Map<string, WeightedPlacementRecord>;
  order: string[];

  constructor(items: Map<string, WeightedPlacementRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPlacementRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPlacementRecord): void {
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

  list(): WeightedPlacementRecord[] {
    const out: WeightedPlacementRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPlacementRecordStore(): WeightedPlacementRecordStore {
  return new MemoryWeightedPlacementRecordStore(new Map<string, WeightedPlacementRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPlacementRecordStore implements WeightedPlacementRecordStore {
  inner: WeightedPlacementRecordStore;
  cache: cache.TtlCache<WeightedPlacementRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPlacementRecordStore,
    cacheValue: cache.TtlCache<WeightedPlacementRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPlacementRecord | undefined {
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

  save(item: WeightedPlacementRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPlacementRecord[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPlacementRecordStore(inner: WeightedPlacementRecordStore, ttl: number, clockValue: clock.Clock): WeightedPlacementRecordStore {
  return new CachedWeightedPlacementRecordStore(
    inner,
    cache.newTtlCache<WeightedPlacementRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted placement records. Empty fields match all. */
export class WeightedPlacementRecordQuery {
  channel: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMaximum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPlacementRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPlacementRecord[]): WeightedPlacementRecord[] {
    const matched = collections.filter(items, (candidate: WeightedPlacementRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPlacementRecords(store: WeightedPlacementRecordStore, query: WeightedPlacementRecordQuery): WeightedPlacementRecord[] {
  return query.apply(store.list());
}
