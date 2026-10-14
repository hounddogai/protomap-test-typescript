import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryModelSlot } from "./primary-model-slot.js";

/** Keeps primary model slots by code. */
export interface PrimaryModelSlotStore {
  find(code: string): PrimaryModelSlot | undefined;
  save(item: PrimaryModelSlot): void;
  remove(code: string): boolean;
  list(): PrimaryModelSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryModelSlotStore implements PrimaryModelSlotStore {
  items: Map<string, PrimaryModelSlot>;
  order: string[];

  constructor(items: Map<string, PrimaryModelSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryModelSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryModelSlot): void {
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

  list(): PrimaryModelSlot[] {
    const out: PrimaryModelSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryModelSlotStore(): PrimaryModelSlotStore {
  return new MemoryPrimaryModelSlotStore(new Map<string, PrimaryModelSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryModelSlotStore implements PrimaryModelSlotStore {
  inner: PrimaryModelSlotStore;
  cache: cache.TtlCache<PrimaryModelSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryModelSlotStore,
    cacheValue: cache.TtlCache<PrimaryModelSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryModelSlot | undefined {
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

  save(item: PrimaryModelSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryModelSlot[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryModelSlotStore(inner: PrimaryModelSlotStore, ttl: number, clockValue: clock.Clock): PrimaryModelSlotStore {
  return new CachedPrimaryModelSlotStore(inner, cache.newTtlCache<PrimaryModelSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects primary model slots. Empty fields match all. */
export class PrimaryModelSlotQuery {
  locale: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minStartsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryModelSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryModelSlot[]): PrimaryModelSlot[] {
    const matched = collections.filter(items, (candidate: PrimaryModelSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryModelSlots(store: PrimaryModelSlotStore, query: PrimaryModelSlotQuery): PrimaryModelSlot[] {
  return query.apply(store.list());
}
