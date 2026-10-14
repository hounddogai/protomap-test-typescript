import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditTarget } from "./credit-target.js";

/** Keeps credit targets by code. */
export interface CreditTargetStore {
  find(code: string): CreditTarget | undefined;
  save(item: CreditTarget): void;
  remove(code: string): boolean;
  list(): CreditTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditTargetStore implements CreditTargetStore {
  items: Map<string, CreditTarget>;
  order: string[];

  constructor(items: Map<string, CreditTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditTarget): void {
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

  list(): CreditTarget[] {
    const out: CreditTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditTargetStore(): CreditTargetStore {
  return new MemoryCreditTargetStore(new Map<string, CreditTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditTargetStore implements CreditTargetStore {
  inner: CreditTargetStore;
  cache: cache.TtlCache<CreditTarget>;
  hits: number;
  misses: number;

  constructor(inner: CreditTargetStore, cacheValue: cache.TtlCache<CreditTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditTarget | undefined {
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

  save(item: CreditTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditTarget[] {
    return this.inner.list();
  }
}

export function newCachedCreditTargetStore(inner: CreditTargetStore, ttl: number, clockValue: clock.Clock): CreditTargetStore {
  return new CachedCreditTargetStore(inner, cache.newTtlCache<CreditTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects credit targets. Empty fields match all. */
export class CreditTargetQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditTarget): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditTarget[]): CreditTarget[] {
    const matched = collections.filter(items, (candidate: CreditTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditTargets(store: CreditTargetStore, query: CreditTargetQuery): CreditTarget[] {
  return query.apply(store.list());
}
