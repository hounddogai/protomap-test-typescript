import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelRecord } from "./model-record.js";

/** Keeps model records by code. */
export interface ModelRecordStore {
  find(code: string): ModelRecord | undefined;
  save(item: ModelRecord): void;
  remove(code: string): boolean;
  list(): ModelRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelRecordStore implements ModelRecordStore {
  items: Map<string, ModelRecord>;
  order: string[];

  constructor(items: Map<string, ModelRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelRecord): void {
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

  list(): ModelRecord[] {
    const out: ModelRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelRecordStore(): ModelRecordStore {
  return new MemoryModelRecordStore(new Map<string, ModelRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelRecordStore implements ModelRecordStore {
  inner: ModelRecordStore;
  cache: cache.TtlCache<ModelRecord>;
  hits: number;
  misses: number;

  constructor(inner: ModelRecordStore, cacheValue: cache.TtlCache<ModelRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelRecord | undefined {
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

  save(item: ModelRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelRecord[] {
    return this.inner.list();
  }
}

export function newCachedModelRecordStore(inner: ModelRecordStore, ttl: number, clockValue: clock.Clock): ModelRecordStore {
  return new CachedModelRecordStore(inner, cache.newTtlCache<ModelRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects model records. Empty fields match all. */
export class ModelRecordQuery {
  utmSource: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minScore: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelRecord): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelRecord[]): ModelRecord[] {
    const matched = collections.filter(items, (candidate: ModelRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelRecords(store: ModelRecordStore, query: ModelRecordQuery): ModelRecord[] {
  return query.apply(store.list());
}
