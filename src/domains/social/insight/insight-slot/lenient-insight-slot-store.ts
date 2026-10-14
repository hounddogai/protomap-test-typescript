import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientInsightSlot } from "./lenient-insight-slot.js";

/** Keeps lenient insight slots by code. */
export interface LenientInsightSlotStore {
  find(code: string): LenientInsightSlot | undefined;
  save(item: LenientInsightSlot): void;
  remove(code: string): boolean;
  list(): LenientInsightSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientInsightSlotStore implements LenientInsightSlotStore {
  items: Map<string, LenientInsightSlot>;
  order: string[];

  constructor(items: Map<string, LenientInsightSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientInsightSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientInsightSlot): void {
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

  list(): LenientInsightSlot[] {
    const out: LenientInsightSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientInsightSlotStore(): LenientInsightSlotStore {
  return new MemoryLenientInsightSlotStore(new Map<string, LenientInsightSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientInsightSlotStore implements LenientInsightSlotStore {
  inner: LenientInsightSlotStore;
  cache: cache.TtlCache<LenientInsightSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientInsightSlotStore,
    cacheValue: cache.TtlCache<LenientInsightSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientInsightSlot | undefined {
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

  save(item: LenientInsightSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientInsightSlot[] {
    return this.inner.list();
  }
}

export function newCachedLenientInsightSlotStore(inner: LenientInsightSlotStore, ttl: number, clockValue: clock.Clock): LenientInsightSlotStore {
  return new CachedLenientInsightSlotStore(inner, cache.newTtlCache<LenientInsightSlot>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient insight slots. Empty fields match all. */
export class LenientInsightSlotQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientInsightSlot): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientInsightSlot[]): LenientInsightSlot[] {
    const matched = collections.filter(items, (candidate: LenientInsightSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientInsightSlots(store: LenientInsightSlotStore, query: LenientInsightSlotQuery): LenientInsightSlot[] {
  return query.apply(store.list());
}
