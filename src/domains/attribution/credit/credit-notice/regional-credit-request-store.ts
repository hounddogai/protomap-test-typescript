import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCreditRequest } from "./regional-credit-request.js";

/** Keeps regional credit requests by code. */
export interface RegionalCreditRequestStore {
  find(code: string): RegionalCreditRequest | undefined;
  save(item: RegionalCreditRequest): void;
  remove(code: string): boolean;
  list(): RegionalCreditRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCreditRequestStore implements RegionalCreditRequestStore {
  items: Map<string, RegionalCreditRequest>;
  order: string[];

  constructor(items: Map<string, RegionalCreditRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCreditRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCreditRequest): void {
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

  list(): RegionalCreditRequest[] {
    const out: RegionalCreditRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCreditRequestStore(): RegionalCreditRequestStore {
  return new MemoryRegionalCreditRequestStore(new Map<string, RegionalCreditRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCreditRequestStore implements RegionalCreditRequestStore {
  inner: RegionalCreditRequestStore;
  cache: cache.TtlCache<RegionalCreditRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCreditRequestStore,
    cacheValue: cache.TtlCache<RegionalCreditRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCreditRequest | undefined {
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

  save(item: RegionalCreditRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCreditRequest[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCreditRequestStore(inner: RegionalCreditRequestStore, ttl: number, clockValue: clock.Clock): RegionalCreditRequestStore {
  return new CachedRegionalCreditRequestStore(
    inner,
    cache.newTtlCache<RegionalCreditRequest>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional credit requests. Empty fields match all. */
export class RegionalCreditRequestQuery {
  locale: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minGraceDays: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCreditRequest): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCreditRequest[]): RegionalCreditRequest[] {
    const matched = collections.filter(items, (candidate: RegionalCreditRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCreditRequests(store: RegionalCreditRequestStore, query: RegionalCreditRequestQuery): RegionalCreditRequest[] {
  return query.apply(store.list());
}
