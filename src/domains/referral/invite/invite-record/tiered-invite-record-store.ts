import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredInviteRecord } from "./tiered-invite-record.js";

/** Keeps tiered invite records by code. */
export interface TieredInviteRecordStore {
  find(code: string): TieredInviteRecord | undefined;
  save(item: TieredInviteRecord): void;
  remove(code: string): boolean;
  list(): TieredInviteRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredInviteRecordStore implements TieredInviteRecordStore {
  items: Map<string, TieredInviteRecord>;
  order: string[];

  constructor(items: Map<string, TieredInviteRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredInviteRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredInviteRecord): void {
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

  list(): TieredInviteRecord[] {
    const out: TieredInviteRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredInviteRecordStore(): TieredInviteRecordStore {
  return new MemoryTieredInviteRecordStore(new Map<string, TieredInviteRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredInviteRecordStore implements TieredInviteRecordStore {
  inner: TieredInviteRecordStore;
  cache: cache.TtlCache<TieredInviteRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredInviteRecordStore,
    cacheValue: cache.TtlCache<TieredInviteRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredInviteRecord | undefined {
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

  save(item: TieredInviteRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredInviteRecord[] {
    return this.inner.list();
  }
}

export function newCachedTieredInviteRecordStore(inner: TieredInviteRecordStore, ttl: number, clockValue: clock.Clock): TieredInviteRecordStore {
  return new CachedTieredInviteRecordStore(inner, cache.newTtlCache<TieredInviteRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects tiered invite records. Empty fields match all. */
export class TieredInviteRecordQuery {
  region: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minEndsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredInviteRecord): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredInviteRecord[]): TieredInviteRecord[] {
    const matched = collections.filter(items, (candidate: TieredInviteRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredInviteRecords(store: TieredInviteRecordStore, query: TieredInviteRecordQuery): TieredInviteRecord[] {
  return query.apply(store.list());
}
