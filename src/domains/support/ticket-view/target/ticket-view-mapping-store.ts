import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewMapping } from "./ticket-view-mapping.js";

/** Keeps ticket view mappings by code. */
export interface TicketViewMappingStore {
  find(code: string): TicketViewMapping | undefined;
  save(item: TicketViewMapping): void;
  remove(code: string): boolean;
  list(): TicketViewMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewMappingStore implements TicketViewMappingStore {
  items: Map<string, TicketViewMapping>;
  order: string[];

  constructor(items: Map<string, TicketViewMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewMapping): void {
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

  list(): TicketViewMapping[] {
    const out: TicketViewMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewMappingStore(): TicketViewMappingStore {
  return new MemoryTicketViewMappingStore(new Map<string, TicketViewMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewMappingStore implements TicketViewMappingStore {
  inner: TicketViewMappingStore;
  cache: cache.TtlCache<TicketViewMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewMappingStore,
    cacheValue: cache.TtlCache<TicketViewMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewMapping | undefined {
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

  save(item: TicketViewMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewMapping[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewMappingStore(inner: TicketViewMappingStore, ttl: number, clockValue: clock.Clock): TicketViewMappingStore {
  return new CachedTicketViewMappingStore(inner, cache.newTtlCache<TicketViewMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects ticket view mappings. Empty fields match all. */
export class TicketViewMappingQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewMapping[]): TicketViewMapping[] {
    const matched = collections.filter(items, (candidate: TicketViewMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewMappings(store: TicketViewMappingStore, query: TicketViewMappingQuery): TicketViewMapping[] {
  return query.apply(store.list());
}
