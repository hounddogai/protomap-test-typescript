import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedDoubleOptInSlot } from "./capped-double-opt-in-slot.js";

/** Keeps capped double opt in slots by code. */
export interface CappedDoubleOptInSlotStore {
  find(code: string): CappedDoubleOptInSlot | undefined;
  save(item: CappedDoubleOptInSlot): void;
  remove(code: string): boolean;
  list(): CappedDoubleOptInSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedDoubleOptInSlotStore implements CappedDoubleOptInSlotStore {
  items: Map<string, CappedDoubleOptInSlot>;
  order: string[];

  constructor(items: Map<string, CappedDoubleOptInSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedDoubleOptInSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedDoubleOptInSlot): void {
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

  list(): CappedDoubleOptInSlot[] {
    const out: CappedDoubleOptInSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedDoubleOptInSlotStore(): CappedDoubleOptInSlotStore {
  return new MemoryCappedDoubleOptInSlotStore(new Map<string, CappedDoubleOptInSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedDoubleOptInSlotStore implements CappedDoubleOptInSlotStore {
  inner: CappedDoubleOptInSlotStore;
  cache: cache.TtlCache<CappedDoubleOptInSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedDoubleOptInSlotStore,
    cacheValue: cache.TtlCache<CappedDoubleOptInSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedDoubleOptInSlot | undefined {
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

  save(item: CappedDoubleOptInSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedDoubleOptInSlot[] {
    return this.inner.list();
  }
}

export function newCachedCappedDoubleOptInSlotStore(inner: CappedDoubleOptInSlotStore, ttl: number, clockValue: clock.Clock): CappedDoubleOptInSlotStore {
  return new CachedCappedDoubleOptInSlotStore(
    inner,
    cache.newTtlCache<CappedDoubleOptInSlot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped double opt in slots. Empty fields match all. */
export class CappedDoubleOptInSlotQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedDoubleOptInSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedDoubleOptInSlot[]): CappedDoubleOptInSlot[] {
    const matched = collections.filter(items, (candidate: CappedDoubleOptInSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedDoubleOptInSlots(store: CappedDoubleOptInSlotStore, query: CappedDoubleOptInSlotQuery): CappedDoubleOptInSlot[] {
  return query.apply(store.list());
}
