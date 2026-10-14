import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreditBundle } from "./credit-bundle.js";

/** Keeps credit bundles by code. */
export interface CreditBundleStore {
  find(code: string): CreditBundle | undefined;
  save(item: CreditBundle): void;
  remove(code: string): boolean;
  list(): CreditBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreditBundleStore implements CreditBundleStore {
  items: Map<string, CreditBundle>;
  order: string[];

  constructor(items: Map<string, CreditBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreditBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreditBundle): void {
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

  list(): CreditBundle[] {
    const out: CreditBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreditBundleStore(): CreditBundleStore {
  return new MemoryCreditBundleStore(new Map<string, CreditBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreditBundleStore implements CreditBundleStore {
  inner: CreditBundleStore;
  cache: cache.TtlCache<CreditBundle>;
  hits: number;
  misses: number;

  constructor(inner: CreditBundleStore, cacheValue: cache.TtlCache<CreditBundle>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreditBundle | undefined {
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

  save(item: CreditBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreditBundle[] {
    return this.inner.list();
  }
}

export function newCachedCreditBundleStore(inner: CreditBundleStore, ttl: number, clockValue: clock.Clock): CreditBundleStore {
  return new CachedCreditBundleStore(inner, cache.newTtlCache<CreditBundle>(128, ttl, clockValue), 0, 0);
}

/** Selects credit bundles. Empty fields match all. */
export class CreditBundleQuery {
  source: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minAmount: number, statuses: string[], limit: number) {
    this.source = source;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreditBundle): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreditBundle[]): CreditBundle[] {
    const matched = collections.filter(items, (candidate: CreditBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreditBundles(store: CreditBundleStore, query: CreditBundleQuery): CreditBundle[] {
  return query.apply(store.list());
}
