import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyBranchTier } from "./legacy-branch-tier.js";

/** Keeps legacy branch tiers by code. */
export interface LegacyBranchTierStore {
  find(code: string): LegacyBranchTier | undefined;
  save(item: LegacyBranchTier): void;
  remove(code: string): boolean;
  list(): LegacyBranchTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyBranchTierStore implements LegacyBranchTierStore {
  items: Map<string, LegacyBranchTier>;
  order: string[];

  constructor(items: Map<string, LegacyBranchTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyBranchTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyBranchTier): void {
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

  list(): LegacyBranchTier[] {
    const out: LegacyBranchTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyBranchTierStore(): LegacyBranchTierStore {
  return new MemoryLegacyBranchTierStore(new Map<string, LegacyBranchTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyBranchTierStore implements LegacyBranchTierStore {
  inner: LegacyBranchTierStore;
  cache: cache.TtlCache<LegacyBranchTier>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyBranchTierStore,
    cacheValue: cache.TtlCache<LegacyBranchTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyBranchTier | undefined {
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

  save(item: LegacyBranchTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyBranchTier[] {
    return this.inner.list();
  }
}

export function newCachedLegacyBranchTierStore(inner: LegacyBranchTierStore, ttl: number, clockValue: clock.Clock): LegacyBranchTierStore {
  return new CachedLegacyBranchTierStore(inner, cache.newTtlCache<LegacyBranchTier>(256, ttl, clockValue), 0, 0);
}

/** Selects legacy branch tiers. Empty fields match all. */
export class LegacyBranchTierQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyBranchTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyBranchTier[]): LegacyBranchTier[] {
    const matched = collections.filter(items, (candidate: LegacyBranchTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyBranchTiers(store: LegacyBranchTierStore, query: LegacyBranchTierQuery): LegacyBranchTier[] {
  return query.apply(store.list());
}
