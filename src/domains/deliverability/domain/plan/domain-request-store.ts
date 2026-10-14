import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainRequest } from "./domain-request.js";

/** Keeps domain requests by code. */
export interface DomainRequestStore {
  find(code: string): DomainRequest | undefined;
  save(item: DomainRequest): void;
  remove(code: string): boolean;
  list(): DomainRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainRequestStore implements DomainRequestStore {
  items: Map<string, DomainRequest>;
  order: string[];

  constructor(items: Map<string, DomainRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainRequest): void {
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

  list(): DomainRequest[] {
    const out: DomainRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainRequestStore(): DomainRequestStore {
  return new MemoryDomainRequestStore(new Map<string, DomainRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainRequestStore implements DomainRequestStore {
  inner: DomainRequestStore;
  cache: cache.TtlCache<DomainRequest>;
  hits: number;
  misses: number;

  constructor(inner: DomainRequestStore, cacheValue: cache.TtlCache<DomainRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainRequest | undefined {
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

  save(item: DomainRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainRequest[] {
    return this.inner.list();
  }
}

export function newCachedDomainRequestStore(inner: DomainRequestStore, ttl: number, clockValue: clock.Clock): DomainRequestStore {
  return new CachedDomainRequestStore(inner, cache.newTtlCache<DomainRequest>(512, ttl, clockValue), 0, 0);
}

/** Selects domain requests. Empty fields match all. */
export class DomainRequestQuery {
  title: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDiscount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainRequest): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainRequest[]): DomainRequest[] {
    const matched = collections.filter(items, (candidate: DomainRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainRequests(store: DomainRequestStore, query: DomainRequestQuery): DomainRequest[] {
  return query.apply(store.list());
}
