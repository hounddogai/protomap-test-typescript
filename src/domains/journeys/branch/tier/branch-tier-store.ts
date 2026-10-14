import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchTier } from "./branch-tier.js";

/** Keeps branch tiers by code. */
export interface BranchTierStore {
  find(code: string): BranchTier | undefined;
  save(item: BranchTier): void;
  remove(code: string): boolean;
  list(): BranchTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchTierStore implements BranchTierStore {
  items: Map<string, BranchTier>;
  order: string[];

  constructor(items: Map<string, BranchTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchTier): void {
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

  list(): BranchTier[] {
    const out: BranchTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchTierStore(): BranchTierStore {
  return new MemoryBranchTierStore(new Map<string, BranchTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchTierStore implements BranchTierStore {
  inner: BranchTierStore;
  cache: cache.TtlCache<BranchTier>;
  hits: number;
  misses: number;

  constructor(inner: BranchTierStore, cacheValue: cache.TtlCache<BranchTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchTier | undefined {
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

  save(item: BranchTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchTier[] {
    return this.inner.list();
  }
}

export function newCachedBranchTierStore(inner: BranchTierStore, ttl: number, clockValue: clock.Clock): BranchTierStore {
  return new CachedBranchTierStore(inner, cache.newTtlCache<BranchTier>(64, ttl, clockValue), 0, 0);
}

/** Selects branch tiers. Empty fields match all. */
export class BranchTierQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchTier): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchTier[]): BranchTier[] {
    const matched = collections.filter(items, (candidate: BranchTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchTiers(store: BranchTierStore, query: BranchTierQuery): BranchTier[] {
  return query.apply(store.list());
}
