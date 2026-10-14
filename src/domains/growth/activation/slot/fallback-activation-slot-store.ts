import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackActivationSlot } from "./fallback-activation-slot.js";

/** Keeps fallback activation slots by code. */
export interface FallbackActivationSlotStore {
  find(code: string): FallbackActivationSlot | undefined;
  save(item: FallbackActivationSlot): void;
  remove(code: string): boolean;
  list(): FallbackActivationSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackActivationSlotStore implements FallbackActivationSlotStore {
  items: Map<string, FallbackActivationSlot>;
  order: string[];

  constructor(items: Map<string, FallbackActivationSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackActivationSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackActivationSlot): void {
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

  list(): FallbackActivationSlot[] {
    const out: FallbackActivationSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackActivationSlotStore(): FallbackActivationSlotStore {
  return new MemoryFallbackActivationSlotStore(new Map<string, FallbackActivationSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackActivationSlotStore implements FallbackActivationSlotStore {
  inner: FallbackActivationSlotStore;
  cache: cache.TtlCache<FallbackActivationSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackActivationSlotStore,
    cacheValue: cache.TtlCache<FallbackActivationSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackActivationSlot | undefined {
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

  save(item: FallbackActivationSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackActivationSlot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackActivationSlotStore(inner: FallbackActivationSlotStore, ttl: number, clockValue: clock.Clock): FallbackActivationSlotStore {
  return new CachedFallbackActivationSlotStore(
    inner,
    cache.newTtlCache<FallbackActivationSlot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback activation slots. Empty fields match all. */
export class FallbackActivationSlotQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackActivationSlot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackActivationSlot[]): FallbackActivationSlot[] {
    const matched = collections.filter(items, (candidate: FallbackActivationSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackActivationSlots(store: FallbackActivationSlotStore, query: FallbackActivationSlotQuery): FallbackActivationSlot[] {
  return query.apply(store.list());
}
