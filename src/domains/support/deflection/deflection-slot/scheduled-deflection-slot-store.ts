import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

/** Keeps scheduled deflection slots by code. */
export interface ScheduledDeflectionSlotStore {
  find(code: string): ScheduledDeflectionSlot | undefined;
  save(item: ScheduledDeflectionSlot): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionSlotStore implements ScheduledDeflectionSlotStore {
  items: Map<string, ScheduledDeflectionSlot>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionSlot): void {
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

  list(): ScheduledDeflectionSlot[] {
    const out: ScheduledDeflectionSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionSlotStore(): ScheduledDeflectionSlotStore {
  return new MemoryScheduledDeflectionSlotStore(new Map<string, ScheduledDeflectionSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionSlotStore implements ScheduledDeflectionSlotStore {
  inner: ScheduledDeflectionSlotStore;
  cache: cache.TtlCache<ScheduledDeflectionSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionSlotStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionSlot | undefined {
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

  save(item: ScheduledDeflectionSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionSlot[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionSlotStore(inner: ScheduledDeflectionSlotStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionSlotStore {
  return new CachedScheduledDeflectionSlotStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionSlot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection slots. Empty fields match all. */
export class ScheduledDeflectionSlotQuery {
  utmSource: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minAttempts: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionSlot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionSlot[]): ScheduledDeflectionSlot[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionSlots(store: ScheduledDeflectionSlotStore, query: ScheduledDeflectionSlotQuery): ScheduledDeflectionSlot[] {
  return query.apply(store.list());
}
