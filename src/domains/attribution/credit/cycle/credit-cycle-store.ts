import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditCycle } from "./credit-cycle.js";

/** Keeps credit cycles by code. */
export interface CreditCycleStore {
  find(code: string): CreditCycle | undefined;
  save(item: CreditCycle): void;
  remove(code: string): boolean;
  list(): CreditCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditCycleStore implements CreditCycleStore {
  items: Map<string, CreditCycle>;
  order: string[];

  constructor(items: Map<string, CreditCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditCycle): void {
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

  list(): CreditCycle[] {
    const out: CreditCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditCycleStore(): CreditCycleStore {
  return new MemoryCreditCycleStore(new Map<string, CreditCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditCycleStore implements CreditCycleStore {
  inner: CreditCycleStore;
  cache: cache.TtlCache<CreditCycle>;
  hits: number;
  misses: number;

  constructor(inner: CreditCycleStore, cacheValue: cache.TtlCache<CreditCycle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditCycle | undefined {
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

  save(item: CreditCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditCycle[] {
    return this.inner.list();
  }
}

export function newCachedCreditCycleStore(inner: CreditCycleStore, ttl: number, clockValue: clock.Clock): CreditCycleStore {
  return new CachedCreditCycleStore(inner, cache.newTtlCache<CreditCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects credit cycles. Empty fields match all. */
export class CreditCycleQuery {
  channel: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBid: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditCycle): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditCycle[]): CreditCycle[] {
    const matched = collections.filter(items, (candidate: CreditCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditCycles(store: CreditCycleStore, query: CreditCycleQuery): CreditCycle[] {
  return query.apply(store.list());
}
