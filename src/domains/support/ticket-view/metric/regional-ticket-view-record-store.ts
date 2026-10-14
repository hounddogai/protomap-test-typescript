import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalTicketViewRecord } from "./regional-ticket-view-record.js";

/** Keeps regional ticket view records by code. */
export interface RegionalTicketViewRecordStore {
  find(code: string): RegionalTicketViewRecord | undefined;
  save(item: RegionalTicketViewRecord): void;
  remove(code: string): boolean;
  list(): RegionalTicketViewRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalTicketViewRecordStore implements RegionalTicketViewRecordStore {
  items: Map<string, RegionalTicketViewRecord>;
  order: string[];

  constructor(items: Map<string, RegionalTicketViewRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalTicketViewRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalTicketViewRecord): void {
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

  list(): RegionalTicketViewRecord[] {
    const out: RegionalTicketViewRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalTicketViewRecordStore(): RegionalTicketViewRecordStore {
  return new MemoryRegionalTicketViewRecordStore(new Map<string, RegionalTicketViewRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalTicketViewRecordStore implements RegionalTicketViewRecordStore {
  inner: RegionalTicketViewRecordStore;
  cache: cache.TtlCache<RegionalTicketViewRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalTicketViewRecordStore,
    cacheValue: cache.TtlCache<RegionalTicketViewRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalTicketViewRecord | undefined {
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

  save(item: RegionalTicketViewRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalTicketViewRecord[] {
    return this.inner.list();
  }
}

export function newCachedRegionalTicketViewRecordStore(inner: RegionalTicketViewRecordStore, ttl: number, clockValue: clock.Clock): RegionalTicketViewRecordStore {
  return new CachedRegionalTicketViewRecordStore(
    inner,
    cache.newTtlCache<RegionalTicketViewRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional ticket view records. Empty fields match all. */
export class RegionalTicketViewRecordQuery {
  channel: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSequence: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalTicketViewRecord): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalTicketViewRecord[]): RegionalTicketViewRecord[] {
    const matched = collections.filter(items, (candidate: RegionalTicketViewRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalTicketViewRecords(store: RegionalTicketViewRecordStore, query: RegionalTicketViewRecordQuery): RegionalTicketViewRecord[] {
  return query.apply(store.list());
}
