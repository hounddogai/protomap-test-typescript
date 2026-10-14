import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationTier } from "./reputation-tier.js";

/** Keeps reputation tiers by code. */
export interface ReputationTierStore {
  find(code: string): ReputationTier | undefined;
  save(item: ReputationTier): void;
  remove(code: string): boolean;
  list(): ReputationTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationTierStore implements ReputationTierStore {
  items: Map<string, ReputationTier>;
  order: string[];

  constructor(items: Map<string, ReputationTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationTier): void {
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

  list(): ReputationTier[] {
    const out: ReputationTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationTierStore(): ReputationTierStore {
  return new MemoryReputationTierStore(new Map<string, ReputationTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationTierStore implements ReputationTierStore {
  inner: ReputationTierStore;
  cache: cache.TtlCache<ReputationTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationTierStore,
    cacheValue: cache.TtlCache<ReputationTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationTier | undefined {
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

  save(item: ReputationTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationTier[] {
    return this.inner.list();
  }
}

export function newCachedReputationTierStore(inner: ReputationTierStore, ttl: number, clockValue: clock.Clock): ReputationTierStore {
  return new CachedReputationTierStore(inner, cache.newTtlCache<ReputationTier>(256, ttl, clockValue), 0, 0);
}

/** Selects reputation tiers. Empty fields match all. */
export class ReputationTierQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationTier[]): ReputationTier[] {
    const matched = collections.filter(items, (candidate: ReputationTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationTiers(store: ReputationTierStore, query: ReputationTierQuery): ReputationTier[] {
  return query.apply(store.list());
}
