import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewEntry } from "./ticket-view-entry.js";

/** Keeps ticket view entries by code. */
export interface TicketViewEntryStore {
  find(code: string): TicketViewEntry | undefined;
  save(item: TicketViewEntry): void;
  remove(code: string): boolean;
  list(): TicketViewEntry[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewEntryStore implements TicketViewEntryStore {
  items: Map<string, TicketViewEntry>;
  order: string[];

  constructor(items: Map<string, TicketViewEntry>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewEntry | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewEntry): void {
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

  list(): TicketViewEntry[] {
    const out: TicketViewEntry[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewEntryStore(): TicketViewEntryStore {
  return new MemoryTicketViewEntryStore(new Map<string, TicketViewEntry>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewEntryStore implements TicketViewEntryStore {
  inner: TicketViewEntryStore;
  cache: cache.TtlCache<TicketViewEntry>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewEntryStore,
    cacheValue: cache.TtlCache<TicketViewEntry>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewEntry | undefined {
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

  save(item: TicketViewEntry): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewEntry[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewEntryStore(inner: TicketViewEntryStore, ttl: number, clockValue: clock.Clock): TicketViewEntryStore {
  return new CachedTicketViewEntryStore(inner, cache.newTtlCache<TicketViewEntry>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view entries. Empty fields match all. */
export class TicketViewEntryQuery {
  locale: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAttempts: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewEntry): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewEntry[]): TicketViewEntry[] {
    const matched = collections.filter(items, (candidate: TicketViewEntry): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewEntries(store: TicketViewEntryStore, query: TicketViewEntryQuery): TicketViewEntry[] {
  return query.apply(store.list());
}
