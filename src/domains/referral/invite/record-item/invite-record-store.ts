import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteRecord } from "./invite-record.js";

/** Keeps invite records by code. */
export interface InviteRecordStore {
  find(code: string): InviteRecord | undefined;
  save(item: InviteRecord): void;
  remove(code: string): boolean;
  list(): InviteRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteRecordStore implements InviteRecordStore {
  items: Map<string, InviteRecord>;
  order: string[];

  constructor(items: Map<string, InviteRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteRecord): void {
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

  list(): InviteRecord[] {
    const out: InviteRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteRecordStore(): InviteRecordStore {
  return new MemoryInviteRecordStore(new Map<string, InviteRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteRecordStore implements InviteRecordStore {
  inner: InviteRecordStore;
  cache: cache.TtlCache<InviteRecord>;
  hits: number;
  misses: number;

  constructor(inner: InviteRecordStore, cacheValue: cache.TtlCache<InviteRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteRecord | undefined {
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

  save(item: InviteRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteRecord[] {
    return this.inner.list();
  }
}

export function newCachedInviteRecordStore(inner: InviteRecordStore, ttl: number, clockValue: clock.Clock): InviteRecordStore {
  return new CachedInviteRecordStore(inner, cache.newTtlCache<InviteRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects invite records. Empty fields match all. */
export class InviteRecordQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteRecord): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteRecord[]): InviteRecord[] {
    const matched = collections.filter(items, (candidate: InviteRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteRecords(store: InviteRecordStore, query: InviteRecordQuery): InviteRecord[] {
  return query.apply(store.list());
}
