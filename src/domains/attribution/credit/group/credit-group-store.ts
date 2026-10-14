import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditGroup } from "./credit-group.js";

/** Keeps credit groups by code. */
export interface CreditGroupStore {
  find(code: string): CreditGroup | undefined;
  save(item: CreditGroup): void;
  remove(code: string): boolean;
  list(): CreditGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditGroupStore implements CreditGroupStore {
  items: Map<string, CreditGroup>;
  order: string[];

  constructor(items: Map<string, CreditGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditGroup): void {
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

  list(): CreditGroup[] {
    const out: CreditGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditGroupStore(): CreditGroupStore {
  return new MemoryCreditGroupStore(new Map<string, CreditGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditGroupStore implements CreditGroupStore {
  inner: CreditGroupStore;
  cache: cache.TtlCache<CreditGroup>;
  hits: number;
  misses: number;

  constructor(inner: CreditGroupStore, cacheValue: cache.TtlCache<CreditGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditGroup | undefined {
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

  save(item: CreditGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditGroup[] {
    return this.inner.list();
  }
}

export function newCachedCreditGroupStore(inner: CreditGroupStore, ttl: number, clockValue: clock.Clock): CreditGroupStore {
  return new CachedCreditGroupStore(inner, cache.newTtlCache<CreditGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects credit groups. Empty fields match all. */
export class CreditGroupQuery {
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

  matches(item: CreditGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditGroup[]): CreditGroup[] {
    const matched = collections.filter(items, (candidate: CreditGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditGroups(store: CreditGroupStore, query: CreditGroupQuery): CreditGroup[] {
  return query.apply(store.list());
}
