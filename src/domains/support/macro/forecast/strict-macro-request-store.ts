import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictMacroRequest } from "./strict-macro-request.js";

/** Keeps strict macro requests by code. */
export interface StrictMacroRequestStore {
  find(code: string): StrictMacroRequest | undefined;
  save(item: StrictMacroRequest): void;
  remove(code: string): boolean;
  list(): StrictMacroRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictMacroRequestStore implements StrictMacroRequestStore {
  items: Map<string, StrictMacroRequest>;
  order: string[];

  constructor(items: Map<string, StrictMacroRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictMacroRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictMacroRequest): void {
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

  list(): StrictMacroRequest[] {
    const out: StrictMacroRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictMacroRequestStore(): StrictMacroRequestStore {
  return new MemoryStrictMacroRequestStore(new Map<string, StrictMacroRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictMacroRequestStore implements StrictMacroRequestStore {
  inner: StrictMacroRequestStore;
  cache: cache.TtlCache<StrictMacroRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictMacroRequestStore,
    cacheValue: cache.TtlCache<StrictMacroRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictMacroRequest | undefined {
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

  save(item: StrictMacroRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictMacroRequest[] {
    return this.inner.list();
  }
}

export function newCachedStrictMacroRequestStore(inner: StrictMacroRequestStore, ttl: number, clockValue: clock.Clock): StrictMacroRequestStore {
  return new CachedStrictMacroRequestStore(inner, cache.newTtlCache<StrictMacroRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects strict macro requests. Empty fields match all. */
export class StrictMacroRequestQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictMacroRequest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictMacroRequest[]): StrictMacroRequest[] {
    const matched = collections.filter(items, (candidate: StrictMacroRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictMacroRequests(store: StrictMacroRequestStore, query: StrictMacroRequestQuery): StrictMacroRequest[] {
  return query.apply(store.list());
}
