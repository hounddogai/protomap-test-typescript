import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedActivationSlot } from "./capped-activation-slot.js";

/** Keeps capped activation slots by code. */
export interface CappedActivationSlotStore {
  find(code: string): CappedActivationSlot | undefined;
  save(item: CappedActivationSlot): void;
  remove(code: string): boolean;
  list(): CappedActivationSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedActivationSlotStore implements CappedActivationSlotStore {
  items: Map<string, CappedActivationSlot>;
  order: string[];

  constructor(items: Map<string, CappedActivationSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedActivationSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedActivationSlot): void {
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

  list(): CappedActivationSlot[] {
    const out: CappedActivationSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedActivationSlotStore(): CappedActivationSlotStore {
  return new MemoryCappedActivationSlotStore(new Map<string, CappedActivationSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedActivationSlotStore implements CappedActivationSlotStore {
  inner: CappedActivationSlotStore;
  cache: cache.TtlCache<CappedActivationSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedActivationSlotStore,
    cacheValue: cache.TtlCache<CappedActivationSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedActivationSlot | undefined {
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

  save(item: CappedActivationSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedActivationSlot[] {
    return this.inner.list();
  }
}

export function newCachedCappedActivationSlotStore(inner: CappedActivationSlotStore, ttl: number, clockValue: clock.Clock): CappedActivationSlotStore {
  return new CachedCappedActivationSlotStore(
    inner,
    cache.newTtlCache<CappedActivationSlot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped activation slots. Empty fields match all. */
export class CappedActivationSlotQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedActivationSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedActivationSlot[]): CappedActivationSlot[] {
    const matched = collections.filter(items, (candidate: CappedActivationSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedActivationSlots(store: CappedActivationSlotStore, query: CappedActivationSlotQuery): CappedActivationSlot[] {
  return query.apply(store.list());
}
