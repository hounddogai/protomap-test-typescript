import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchRequest } from "./branch-request.js";

/** Keeps branch requests by code. */
export interface BranchRequestStore {
  find(code: string): BranchRequest | undefined;
  save(item: BranchRequest): void;
  remove(code: string): boolean;
  list(): BranchRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchRequestStore implements BranchRequestStore {
  items: Map<string, BranchRequest>;
  order: string[];

  constructor(items: Map<string, BranchRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchRequest): void {
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

  list(): BranchRequest[] {
    const out: BranchRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchRequestStore(): BranchRequestStore {
  return new MemoryBranchRequestStore(new Map<string, BranchRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchRequestStore implements BranchRequestStore {
  inner: BranchRequestStore;
  cache: cache.TtlCache<BranchRequest>;
  hits: number;
  misses: number;

  constructor(inner: BranchRequestStore, cacheValue: cache.TtlCache<BranchRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchRequest | undefined {
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

  save(item: BranchRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchRequest[] {
    return this.inner.list();
  }
}

export function newCachedBranchRequestStore(inner: BranchRequestStore, ttl: number, clockValue: clock.Clock): BranchRequestStore {
  return new CachedBranchRequestStore(inner, cache.newTtlCache<BranchRequest>(64, ttl, clockValue), 0, 0);
}

/** Selects branch requests. Empty fields match all. */
export class BranchRequestQuery {
  country: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minWeight: number, statuses: string[], limit: number) {
    this.country = country;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchRequest): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchRequest[]): BranchRequest[] {
    const matched = collections.filter(items, (candidate: BranchRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchRequests(store: BranchRequestStore, query: BranchRequestQuery): BranchRequest[] {
  return query.apply(store.list());
}
