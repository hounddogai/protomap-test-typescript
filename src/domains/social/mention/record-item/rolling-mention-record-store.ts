import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingMentionRecord } from "./rolling-mention-record.js";

/** Keeps rolling mention records by code. */
export interface RollingMentionRecordStore {
  find(code: string): RollingMentionRecord | undefined;
  save(item: RollingMentionRecord): void;
  remove(code: string): boolean;
  list(): RollingMentionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingMentionRecordStore implements RollingMentionRecordStore {
  items: Map<string, RollingMentionRecord>;
  order: string[];

  constructor(items: Map<string, RollingMentionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingMentionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingMentionRecord): void {
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

  list(): RollingMentionRecord[] {
    const out: RollingMentionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingMentionRecordStore(): RollingMentionRecordStore {
  return new MemoryRollingMentionRecordStore(new Map<string, RollingMentionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingMentionRecordStore implements RollingMentionRecordStore {
  inner: RollingMentionRecordStore;
  cache: cache.TtlCache<RollingMentionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingMentionRecordStore,
    cacheValue: cache.TtlCache<RollingMentionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingMentionRecord | undefined {
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

  save(item: RollingMentionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingMentionRecord[] {
    return this.inner.list();
  }
}

export function newCachedRollingMentionRecordStore(inner: RollingMentionRecordStore, ttl: number, clockValue: clock.Clock): RollingMentionRecordStore {
  return new CachedRollingMentionRecordStore(
    inner,
    cache.newTtlCache<RollingMentionRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling mention records. Empty fields match all. */
export class RollingMentionRecordQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingMentionRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingMentionRecord[]): RollingMentionRecord[] {
    const matched = collections.filter(items, (candidate: RollingMentionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingMentionRecords(store: RollingMentionRecordStore, query: RollingMentionRecordQuery): RollingMentionRecord[] {
  return query.apply(store.list());
}
