import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientDomainRequest } from "./lenient-domain-request.js";

/** Keeps lenient domain requests by code. */
export interface LenientDomainRequestStore {
  find(code: string): LenientDomainRequest | undefined;
  save(item: LenientDomainRequest): void;
  remove(code: string): boolean;
  list(): LenientDomainRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientDomainRequestStore implements LenientDomainRequestStore {
  items: Map<string, LenientDomainRequest>;
  order: string[];

  constructor(items: Map<string, LenientDomainRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientDomainRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientDomainRequest): void {
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

  list(): LenientDomainRequest[] {
    const out: LenientDomainRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientDomainRequestStore(): LenientDomainRequestStore {
  return new MemoryLenientDomainRequestStore(new Map<string, LenientDomainRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientDomainRequestStore implements LenientDomainRequestStore {
  inner: LenientDomainRequestStore;
  cache: cache.TtlCache<LenientDomainRequest>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientDomainRequestStore,
    cacheValue: cache.TtlCache<LenientDomainRequest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientDomainRequest | undefined {
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

  save(item: LenientDomainRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientDomainRequest[] {
    return this.inner.list();
  }
}

export function newCachedLenientDomainRequestStore(inner: LenientDomainRequestStore, ttl: number, clockValue: clock.Clock): LenientDomainRequestStore {
  return new CachedLenientDomainRequestStore(
    inner,
    cache.newTtlCache<LenientDomainRequest>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient domain requests. Empty fields match all. */
export class LenientDomainRequestQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientDomainRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientDomainRequest[]): LenientDomainRequest[] {
    const matched = collections.filter(items, (candidate: LenientDomainRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientDomainRequests(store: LenientDomainRequestStore, query: LenientDomainRequestQuery): LenientDomainRequest[] {
  return query.apply(store.list());
}
