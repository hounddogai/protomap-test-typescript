import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditSlot } from "./credit-slot.js";

/** Keeps credit slots by code. */
export interface CreditSlotStore {
  find(code: string): CreditSlot | undefined;
  save(item: CreditSlot): void;
  remove(code: string): boolean;
  list(): CreditSlot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditSlotStore implements CreditSlotStore {
  items: Map<string, CreditSlot>;
  order: string[];

  constructor(items: Map<string, CreditSlot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditSlot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditSlot): void {
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

  list(): CreditSlot[] {
    const out: CreditSlot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditSlotStore(): CreditSlotStore {
  return new MemoryCreditSlotStore(new Map<string, CreditSlot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditSlotStore implements CreditSlotStore {
  inner: CreditSlotStore;
  cache: cache.TtlCache<CreditSlot>;
  hits: number;
  misses: number;

  constructor(inner: CreditSlotStore, cacheValue: cache.TtlCache<CreditSlot>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditSlot | undefined {
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

  save(item: CreditSlot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditSlot[] {
    return this.inner.list();
  }
}

export function newCachedCreditSlotStore(inner: CreditSlotStore, ttl: number, clockValue: clock.Clock): CreditSlotStore {
  return new CachedCreditSlotStore(inner, cache.newTtlCache<CreditSlot>(64, ttl, clockValue), 0, 0);
}

/** Selects credit slots. Empty fields match all. */
export class CreditSlotQuery {
  title: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMaximum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditSlot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditSlot[]): CreditSlot[] {
    const matched = collections.filter(items, (candidate: CreditSlot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditSlots(store: CreditSlotStore, query: CreditSlotQuery): CreditSlot[] {
  return query.apply(store.list());
}
