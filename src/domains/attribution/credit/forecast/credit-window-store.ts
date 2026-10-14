import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditWindow } from "./credit-window.js";

/** Keeps credit windows by code. */
export interface CreditWindowStore {
  find(code: string): CreditWindow | undefined;
  save(item: CreditWindow): void;
  remove(code: string): boolean;
  list(): CreditWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditWindowStore implements CreditWindowStore {
  items: Map<string, CreditWindow>;
  order: string[];

  constructor(items: Map<string, CreditWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditWindow): void {
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

  list(): CreditWindow[] {
    const out: CreditWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditWindowStore(): CreditWindowStore {
  return new MemoryCreditWindowStore(new Map<string, CreditWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditWindowStore implements CreditWindowStore {
  inner: CreditWindowStore;
  cache: cache.TtlCache<CreditWindow>;
  hits: number;
  misses: number;

  constructor(inner: CreditWindowStore, cacheValue: cache.TtlCache<CreditWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditWindow | undefined {
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

  save(item: CreditWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditWindow[] {
    return this.inner.list();
  }
}

export function newCachedCreditWindowStore(inner: CreditWindowStore, ttl: number, clockValue: clock.Clock): CreditWindowStore {
  return new CachedCreditWindowStore(inner, cache.newTtlCache<CreditWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects credit windows. Empty fields match all. */
export class CreditWindowQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditWindow): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditWindow[]): CreditWindow[] {
    const matched = collections.filter(items, (candidate: CreditWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditWindows(store: CreditWindowStore, query: CreditWindowQuery): CreditWindow[] {
  return query.apply(store.list());
}
