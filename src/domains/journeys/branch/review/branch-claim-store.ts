import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchClaim } from "./branch-claim.js";

/** Keeps branch claims by code. */
export interface BranchClaimStore {
  find(code: string): BranchClaim | undefined;
  save(item: BranchClaim): void;
  remove(code: string): boolean;
  list(): BranchClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchClaimStore implements BranchClaimStore {
  items: Map<string, BranchClaim>;
  order: string[];

  constructor(items: Map<string, BranchClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchClaim): void {
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

  list(): BranchClaim[] {
    const out: BranchClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchClaimStore(): BranchClaimStore {
  return new MemoryBranchClaimStore(new Map<string, BranchClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchClaimStore implements BranchClaimStore {
  inner: BranchClaimStore;
  cache: cache.TtlCache<BranchClaim>;
  hits: number;
  misses: number;

  constructor(inner: BranchClaimStore, cacheValue: cache.TtlCache<BranchClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchClaim | undefined {
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

  save(item: BranchClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchClaim[] {
    return this.inner.list();
  }
}

export function newCachedBranchClaimStore(inner: BranchClaimStore, ttl: number, clockValue: clock.Clock): BranchClaimStore {
  return new CachedBranchClaimStore(inner, cache.newTtlCache<BranchClaim>(512, ttl, clockValue), 0, 0);
}

/** Selects branch claims. Empty fields match all. */
export class BranchClaimQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchClaim): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchClaim[]): BranchClaim[] {
    const matched = collections.filter(items, (candidate: BranchClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchClaims(store: BranchClaimStore, query: BranchClaimQuery): BranchClaim[] {
  return query.apply(store.list());
}
