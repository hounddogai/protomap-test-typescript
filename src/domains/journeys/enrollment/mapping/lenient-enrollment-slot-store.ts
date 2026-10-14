import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientEnrollmentSlot } from "./lenient-enrollment-slot.js";

/** Keeps lenient enrollment slots by code. */
export interface LenientEnrollmentSlotStore {
  find(code: string): LenientEnrollmentSlot | undefined;
  save(item: LenientEnrollmentSlot): void;
  remove(code: string): boolean;
  list(): LenientEnrollmentSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientEnrollmentSlotStore implements LenientEnrollmentSlotStore {
  items: Map<string, LenientEnrollmentSlot>;
  order: string[];

  constructor(items: Map<string, LenientEnrollmentSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientEnrollmentSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientEnrollmentSlot): void {
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

  list(): LenientEnrollmentSlot[] {
    const out: LenientEnrollmentSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientEnrollmentSlotStore(): LenientEnrollmentSlotStore {
  return new MemoryLenientEnrollmentSlotStore(new Map<string, LenientEnrollmentSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientEnrollmentSlotStore implements LenientEnrollmentSlotStore {
  inner: LenientEnrollmentSlotStore;
  cache: cache.TtlCache<LenientEnrollmentSlot>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientEnrollmentSlotStore,
    cacheValue: cache.TtlCache<LenientEnrollmentSlot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientEnrollmentSlot | undefined {
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

  save(item: LenientEnrollmentSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientEnrollmentSlot[] {
    return this.inner.list();
  }
}

export function newCachedLenientEnrollmentSlotStore(inner: LenientEnrollmentSlotStore, ttl: number, clockValue: clock.Clock): LenientEnrollmentSlotStore {
  return new CachedLenientEnrollmentSlotStore(
    inner,
    cache.newTtlCache<LenientEnrollmentSlot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient enrollment slots. Empty fields match all. */
export class LenientEnrollmentSlotQuery {
  name: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMargin: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientEnrollmentSlot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientEnrollmentSlot[]): LenientEnrollmentSlot[] {
    const matched = collections.filter(items, (candidate: LenientEnrollmentSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientEnrollmentSlots(store: LenientEnrollmentSlotStore, query: LenientEnrollmentSlotQuery): LenientEnrollmentSlot[] {
  return query.apply(store.list());
}
