import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationRecord } from "./activation-record.js";

/** Keeps activation records by code. */
export interface ActivationRecordStore {
  find(code: string): ActivationRecord | undefined;
  save(item: ActivationRecord): void;
  remove(code: string): boolean;
  list(): ActivationRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationRecordStore implements ActivationRecordStore {
  items: Map<string, ActivationRecord>;
  order: string[];

  constructor(items: Map<string, ActivationRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationRecord): void {
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

  list(): ActivationRecord[] {
    const out: ActivationRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationRecordStore(): ActivationRecordStore {
  return new MemoryActivationRecordStore(new Map<string, ActivationRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationRecordStore implements ActivationRecordStore {
  inner: ActivationRecordStore;
  cache: cache.TtlCache<ActivationRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationRecordStore,
    cacheValue: cache.TtlCache<ActivationRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationRecord | undefined {
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

  save(item: ActivationRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationRecord[] {
    return this.inner.list();
  }
}

export function newCachedActivationRecordStore(inner: ActivationRecordStore, ttl: number, clockValue: clock.Clock): ActivationRecordStore {
  return new CachedActivationRecordStore(inner, cache.newTtlCache<ActivationRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects activation records. Empty fields match all. */
export class ActivationRecordQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationRecord[]): ActivationRecord[] {
    const matched = collections.filter(items, (candidate: ActivationRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationRecords(store: ActivationRecordStore, query: ActivationRecordQuery): ActivationRecord[] {
  return query.apply(store.list());
}
