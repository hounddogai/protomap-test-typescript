import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LevelTier } from "./level-tier.js";

/** Keeps level tiers by code. */
export interface LevelTierStore {
  find(code: string): LevelTier | undefined;
  save(item: LevelTier): void;
  remove(code: string): boolean;
  list(): LevelTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLevelTierStore implements LevelTierStore {
  items: Map<string, LevelTier>;
  order: string[];

  constructor(items: Map<string, LevelTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LevelTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LevelTier): void {
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

  list(): LevelTier[] {
    const out: LevelTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLevelTierStore(): LevelTierStore {
  return new MemoryLevelTierStore(new Map<string, LevelTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLevelTierStore implements LevelTierStore {
  inner: LevelTierStore;
  cache: cache.TtlCache<LevelTier>;
  hits: number;
  misses: number;

  constructor(inner: LevelTierStore, cacheValue: cache.TtlCache<LevelTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LevelTier | undefined {
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

  save(item: LevelTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LevelTier[] {
    return this.inner.list();
  }
}

export function newCachedLevelTierStore(inner: LevelTierStore, ttl: number, clockValue: clock.Clock): LevelTierStore {
  return new CachedLevelTierStore(inner, cache.newTtlCache<LevelTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects level tiers. Empty fields match all. */
export class LevelTierQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LevelTier): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LevelTier[]): LevelTier[] {
    const matched = collections.filter(items, (candidate: LevelTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLevelTiers(store: LevelTierStore, query: LevelTierQuery): LevelTier[] {
  return query.apply(store.list());
}
