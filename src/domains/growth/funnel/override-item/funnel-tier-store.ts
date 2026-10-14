import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelTier } from "./funnel-tier.js";

/** Keeps funnel tiers by code. */
export interface FunnelTierStore {
  find(code: string): FunnelTier | undefined;
  save(item: FunnelTier): void;
  remove(code: string): boolean;
  list(): FunnelTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelTierStore implements FunnelTierStore {
  items: Map<string, FunnelTier>;
  order: string[];

  constructor(items: Map<string, FunnelTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelTier): void {
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

  list(): FunnelTier[] {
    const out: FunnelTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelTierStore(): FunnelTierStore {
  return new MemoryFunnelTierStore(new Map<string, FunnelTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelTierStore implements FunnelTierStore {
  inner: FunnelTierStore;
  cache: cache.TtlCache<FunnelTier>;
  hits: number;
  misses: number;

  constructor(inner: FunnelTierStore, cacheValue: cache.TtlCache<FunnelTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelTier | undefined {
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

  save(item: FunnelTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelTier[] {
    return this.inner.list();
  }
}

export function newCachedFunnelTierStore(inner: FunnelTierStore, ttl: number, clockValue: clock.Clock): FunnelTierStore {
  return new CachedFunnelTierStore(inner, cache.newTtlCache<FunnelTier>(256, ttl, clockValue), 0, 0);
}

/** Selects funnel tiers. Empty fields match all. */
export class FunnelTierQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelTier[]): FunnelTier[] {
    const matched = collections.filter(items, (candidate: FunnelTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelTiers(store: FunnelTierStore, query: FunnelTierQuery): FunnelTier[] {
  return query.apply(store.list());
}
