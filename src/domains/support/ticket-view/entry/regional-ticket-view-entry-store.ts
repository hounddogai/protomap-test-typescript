import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalTicketViewEntry } from "./regional-ticket-view-entry.js";

/** Keeps regional ticket view entries by code. */
export interface RegionalTicketViewEntryStore {
  find(code: string): RegionalTicketViewEntry | undefined;
  save(item: RegionalTicketViewEntry): void;
  remove(code: string): boolean;
  list(): RegionalTicketViewEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalTicketViewEntryStore implements RegionalTicketViewEntryStore {
  items: Map<string, RegionalTicketViewEntry>;
  order: string[];

  constructor(items: Map<string, RegionalTicketViewEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalTicketViewEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalTicketViewEntry): void {
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

  list(): RegionalTicketViewEntry[] {
    const out: RegionalTicketViewEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalTicketViewEntryStore(): RegionalTicketViewEntryStore {
  return new MemoryRegionalTicketViewEntryStore(new Map<string, RegionalTicketViewEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalTicketViewEntryStore implements RegionalTicketViewEntryStore {
  inner: RegionalTicketViewEntryStore;
  cache: cache.TtlCache<RegionalTicketViewEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalTicketViewEntryStore,
    cacheValue: cache.TtlCache<RegionalTicketViewEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalTicketViewEntry | undefined {
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

  save(item: RegionalTicketViewEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalTicketViewEntry[] {
    return this.inner.list();
  }
}

export function newCachedRegionalTicketViewEntryStore(inner: RegionalTicketViewEntryStore, ttl: number, clockValue: clock.Clock): RegionalTicketViewEntryStore {
  return new CachedRegionalTicketViewEntryStore(
    inner,
    cache.newTtlCache<RegionalTicketViewEntry>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional ticket view entries. Empty fields match all. */
export class RegionalTicketViewEntryQuery {
  utmSource: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRatio: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalTicketViewEntry): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalTicketViewEntry[]): RegionalTicketViewEntry[] {
    const matched = collections.filter(items, (candidate: RegionalTicketViewEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalTicketViewEntries(store: RegionalTicketViewEntryStore, query: RegionalTicketViewEntryQuery): RegionalTicketViewEntry[] {
  return query.apply(store.list());
}
