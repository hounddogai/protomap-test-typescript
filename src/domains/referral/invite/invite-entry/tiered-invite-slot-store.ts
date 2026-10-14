import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredInviteSlot } from "./tiered-invite-slot.js";

/** Keeps tiered invite slots by code. */
export interface TieredInviteSlotStore {
  find(code: string): TieredInviteSlot | undefined;
  save(item: TieredInviteSlot): void;
  remove(code: string): boolean;
  list(): TieredInviteSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredInviteSlotStore implements TieredInviteSlotStore {
  items: Map<string, TieredInviteSlot>;
  order: string[];

  constructor(items: Map<string, TieredInviteSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredInviteSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredInviteSlot): void {
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

  list(): TieredInviteSlot[] {
    const out: TieredInviteSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredInviteSlotStore(): TieredInviteSlotStore {
  return new MemoryTieredInviteSlotStore(new Map<string, TieredInviteSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredInviteSlotStore implements TieredInviteSlotStore {
  inner: TieredInviteSlotStore;
  cache: cache.TtlCache<TieredInviteSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredInviteSlotStore,
    cacheValue: cache.TtlCache<TieredInviteSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredInviteSlot | undefined {
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

  save(item: TieredInviteSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredInviteSlot[] {
    return this.inner.list();
  }
}

export function newCachedTieredInviteSlotStore(inner: TieredInviteSlotStore, ttl: number, clockValue: clock.Clock): TieredInviteSlotStore {
  return new CachedTieredInviteSlotStore(inner, cache.newTtlCache<TieredInviteSlot>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered invite slots. Empty fields match all. */
export class TieredInviteSlotQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredInviteSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredInviteSlot[]): TieredInviteSlot[] {
    const matched = collections.filter(items, (candidate: TieredInviteSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredInviteSlots(store: TieredInviteSlotStore, query: TieredInviteSlotQuery): TieredInviteSlot[] {
  return query.apply(store.list());
}
