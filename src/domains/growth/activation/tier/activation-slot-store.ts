import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationSlot } from "./activation-slot.js";

/** Keeps activation slots by code. */
export interface ActivationSlotStore {
  find(code: string): ActivationSlot | undefined;
  save(item: ActivationSlot): void;
  remove(code: string): boolean;
  list(): ActivationSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationSlotStore implements ActivationSlotStore {
  items: Map<string, ActivationSlot>;
  order: string[];

  constructor(items: Map<string, ActivationSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationSlot): void {
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

  list(): ActivationSlot[] {
    const out: ActivationSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationSlotStore(): ActivationSlotStore {
  return new MemoryActivationSlotStore(new Map<string, ActivationSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationSlotStore implements ActivationSlotStore {
  inner: ActivationSlotStore;
  cache: cache.TtlCache<ActivationSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationSlotStore,
    cacheValue: cache.TtlCache<ActivationSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationSlot | undefined {
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

  save(item: ActivationSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationSlot[] {
    return this.inner.list();
  }
}

export function newCachedActivationSlotStore(inner: ActivationSlotStore, ttl: number, clockValue: clock.Clock): ActivationSlotStore {
  return new CachedActivationSlotStore(inner, cache.newTtlCache<ActivationSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects activation slots. Empty fields match all. */
export class ActivationSlotQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationSlot[]): ActivationSlot[] {
    const matched = collections.filter(items, (candidate: ActivationSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationSlots(store: ActivationSlotStore, query: ActivationSlotQuery): ActivationSlot[] {
  return query.apply(store.list());
}
