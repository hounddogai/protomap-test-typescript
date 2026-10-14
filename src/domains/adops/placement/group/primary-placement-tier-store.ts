import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPlacementTier } from "./primary-placement-tier.js";

/** Keeps primary placement tiers by code. */
export interface PrimaryPlacementTierStore {
  find(code: string): PrimaryPlacementTier | undefined;
  save(item: PrimaryPlacementTier): void;
  remove(code: string): boolean;
  list(): PrimaryPlacementTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPlacementTierStore implements PrimaryPlacementTierStore {
  items: Map<string, PrimaryPlacementTier>;
  order: string[];

  constructor(items: Map<string, PrimaryPlacementTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPlacementTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPlacementTier): void {
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

  list(): PrimaryPlacementTier[] {
    const out: PrimaryPlacementTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPlacementTierStore(): PrimaryPlacementTierStore {
  return new MemoryPrimaryPlacementTierStore(new Map<string, PrimaryPlacementTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPlacementTierStore implements PrimaryPlacementTierStore {
  inner: PrimaryPlacementTierStore;
  cache: cache.TtlCache<PrimaryPlacementTier>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPlacementTierStore,
    cacheValue: cache.TtlCache<PrimaryPlacementTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPlacementTier | undefined {
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

  save(item: PrimaryPlacementTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPlacementTier[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPlacementTierStore(inner: PrimaryPlacementTierStore, ttl: number, clockValue: clock.Clock): PrimaryPlacementTierStore {
  return new CachedPrimaryPlacementTierStore(
    inner,
    cache.newTtlCache<PrimaryPlacementTier>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary placement tiers. Empty fields match all. */
export class PrimaryPlacementTierQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPlacementTier): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPlacementTier[]): PrimaryPlacementTier[] {
    const matched = collections.filter(items, (candidate: PrimaryPlacementTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPlacementTiers(store: PrimaryPlacementTierStore, query: PrimaryPlacementTierQuery): PrimaryPlacementTier[] {
  return query.apply(store.list());
}
