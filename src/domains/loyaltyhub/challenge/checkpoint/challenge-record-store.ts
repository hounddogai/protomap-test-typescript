import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeRecord } from "./challenge-record.js";

/** Keeps challenge records by code. */
export interface ChallengeRecordStore {
  find(code: string): ChallengeRecord | undefined;
  save(item: ChallengeRecord): void;
  remove(code: string): boolean;
  list(): ChallengeRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeRecordStore implements ChallengeRecordStore {
  items: Map<string, ChallengeRecord>;
  order: string[];

  constructor(items: Map<string, ChallengeRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeRecord): void {
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

  list(): ChallengeRecord[] {
    const out: ChallengeRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeRecordStore(): ChallengeRecordStore {
  return new MemoryChallengeRecordStore(new Map<string, ChallengeRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeRecordStore implements ChallengeRecordStore {
  inner: ChallengeRecordStore;
  cache: cache.TtlCache<ChallengeRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeRecordStore,
    cacheValue: cache.TtlCache<ChallengeRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeRecord | undefined {
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

  save(item: ChallengeRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeRecord[] {
    return this.inner.list();
  }
}

export function newCachedChallengeRecordStore(inner: ChallengeRecordStore, ttl: number, clockValue: clock.Clock): ChallengeRecordStore {
  return new CachedChallengeRecordStore(inner, cache.newTtlCache<ChallengeRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects challenge records. Empty fields match all. */
export class ChallengeRecordQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeRecord[]): ChallengeRecord[] {
    const matched = collections.filter(items, (candidate: ChallengeRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeRecords(store: ChallengeRecordStore, query: ChallengeRecordQuery): ChallengeRecord[] {
  return query.apply(store.list());
}
