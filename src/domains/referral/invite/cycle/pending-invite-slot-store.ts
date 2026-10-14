import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingInviteSlot } from "./pending-invite-slot.js";

/** Keeps pending invite slots by code. */
export interface PendingInviteSlotStore {
  find(code: string): PendingInviteSlot | undefined;
  save(item: PendingInviteSlot): void;
  remove(code: string): boolean;
  list(): PendingInviteSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingInviteSlotStore implements PendingInviteSlotStore {
  items: Map<string, PendingInviteSlot>;
  order: string[];

  constructor(items: Map<string, PendingInviteSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingInviteSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingInviteSlot): void {
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

  list(): PendingInviteSlot[] {
    const out: PendingInviteSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingInviteSlotStore(): PendingInviteSlotStore {
  return new MemoryPendingInviteSlotStore(new Map<string, PendingInviteSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingInviteSlotStore implements PendingInviteSlotStore {
  inner: PendingInviteSlotStore;
  cache: cache.TtlCache<PendingInviteSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingInviteSlotStore,
    cacheValue: cache.TtlCache<PendingInviteSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingInviteSlot | undefined {
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

  save(item: PendingInviteSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingInviteSlot[] {
    return this.inner.list();
  }
}

export function newCachedPendingInviteSlotStore(inner: PendingInviteSlotStore, ttl: number, clockValue: clock.Clock): PendingInviteSlotStore {
  return new CachedPendingInviteSlotStore(inner, cache.newTtlCache<PendingInviteSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects pending invite slots. Empty fields match all. */
export class PendingInviteSlotQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingInviteSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingInviteSlot[]): PendingInviteSlot[] {
    const matched = collections.filter(items, (candidate: PendingInviteSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingInviteSlots(store: PendingInviteSlotStore, query: PendingInviteSlotQuery): PendingInviteSlot[] {
  return query.apply(store.list());
}
