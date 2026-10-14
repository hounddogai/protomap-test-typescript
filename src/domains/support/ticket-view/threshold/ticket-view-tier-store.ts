import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TicketViewTier } from "./ticket-view-tier.js";

/** Keeps ticket view tiers by code. */
export interface TicketViewTierStore {
  find(code: string): TicketViewTier | undefined;
  save(item: TicketViewTier): void;
  remove(code: string): boolean;
  list(): TicketViewTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTicketViewTierStore implements TicketViewTierStore {
  items: Map<string, TicketViewTier>;
  order: string[];

  constructor(items: Map<string, TicketViewTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TicketViewTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TicketViewTier): void {
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

  list(): TicketViewTier[] {
    const out: TicketViewTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTicketViewTierStore(): TicketViewTierStore {
  return new MemoryTicketViewTierStore(new Map<string, TicketViewTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTicketViewTierStore implements TicketViewTierStore {
  inner: TicketViewTierStore;
  cache: cache.TtlCache<TicketViewTier>;
  hits: number;
  misses: number;

  constructor(
    inner: TicketViewTierStore,
    cacheValue: cache.TtlCache<TicketViewTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TicketViewTier | undefined {
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

  save(item: TicketViewTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TicketViewTier[] {
    return this.inner.list();
  }
}

export function newCachedTicketViewTierStore(inner: TicketViewTierStore, ttl: number, clockValue: clock.Clock): TicketViewTierStore {
  return new CachedTicketViewTierStore(inner, cache.newTtlCache<TicketViewTier>(64, ttl, clockValue), 0, 0);
}

/** Selects ticket view tiers. Empty fields match all. */
export class TicketViewTierQuery {
  category: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCost: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TicketViewTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TicketViewTier[]): TicketViewTier[] {
    const matched = collections.filter(items, (candidate: TicketViewTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTicketViewTiers(store: TicketViewTierStore, query: TicketViewTierQuery): TicketViewTier[] {
  return query.apply(store.list());
}
