import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingOptOutTier } from "./pending-opt-out-tier.js";

/** Keeps pending opt out tiers by code. */
export interface PendingOptOutTierStore {
  find(code: string): PendingOptOutTier | undefined;
  save(item: PendingOptOutTier): void;
  remove(code: string): boolean;
  list(): PendingOptOutTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingOptOutTierStore implements PendingOptOutTierStore {
  items: Map<string, PendingOptOutTier>;
  order: string[];

  constructor(items: Map<string, PendingOptOutTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingOptOutTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingOptOutTier): void {
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

  list(): PendingOptOutTier[] {
    const out: PendingOptOutTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingOptOutTierStore(): PendingOptOutTierStore {
  return new MemoryPendingOptOutTierStore(new Map<string, PendingOptOutTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingOptOutTierStore implements PendingOptOutTierStore {
  inner: PendingOptOutTierStore;
  cache: cache.TtlCache<PendingOptOutTier>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingOptOutTierStore,
    cacheValue: cache.TtlCache<PendingOptOutTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingOptOutTier | undefined {
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

  save(item: PendingOptOutTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingOptOutTier[] {
    return this.inner.list();
  }
}

export function newCachedPendingOptOutTierStore(inner: PendingOptOutTierStore, ttl: number, clockValue: clock.Clock): PendingOptOutTierStore {
  return new CachedPendingOptOutTierStore(inner, cache.newTtlCache<PendingOptOutTier>(256, ttl, clockValue), 0, 0);
}

/** Selects pending opt out tiers. Empty fields match all. */
export class PendingOptOutTierQuery {
  unit: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minSequence: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingOptOutTier): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingOptOutTier[]): PendingOptOutTier[] {
    const matched = collections.filter(items, (candidate: PendingOptOutTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingOptOutTiers(store: PendingOptOutTierStore, query: PendingOptOutTierQuery): PendingOptOutTier[] {
  return query.apply(store.list());
}
