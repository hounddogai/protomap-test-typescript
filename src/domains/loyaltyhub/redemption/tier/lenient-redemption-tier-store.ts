import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRedemptionTier } from "./lenient-redemption-tier.js";

/** Keeps lenient redemption tiers by code. */
export interface LenientRedemptionTierStore {
  find(code: string): LenientRedemptionTier | undefined;
  save(item: LenientRedemptionTier): void;
  remove(code: string): boolean;
  list(): LenientRedemptionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRedemptionTierStore implements LenientRedemptionTierStore {
  items: Map<string, LenientRedemptionTier>;
  order: string[];

  constructor(items: Map<string, LenientRedemptionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRedemptionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRedemptionTier): void {
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

  list(): LenientRedemptionTier[] {
    const out: LenientRedemptionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRedemptionTierStore(): LenientRedemptionTierStore {
  return new MemoryLenientRedemptionTierStore(new Map<string, LenientRedemptionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRedemptionTierStore implements LenientRedemptionTierStore {
  inner: LenientRedemptionTierStore;
  cache: cache.TtlCache<LenientRedemptionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRedemptionTierStore,
    cacheValue: cache.TtlCache<LenientRedemptionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRedemptionTier | undefined {
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

  save(item: LenientRedemptionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRedemptionTier[] {
    return this.inner.list();
  }
}

export function newCachedLenientRedemptionTierStore(inner: LenientRedemptionTierStore, ttl: number, clockValue: clock.Clock): LenientRedemptionTierStore {
  return new CachedLenientRedemptionTierStore(
    inner,
    cache.newTtlCache<LenientRedemptionTier>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient redemption tiers. Empty fields match all. */
export class LenientRedemptionTierQuery {
  channel: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minStartsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRedemptionTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRedemptionTier[]): LenientRedemptionTier[] {
    const matched = collections.filter(items, (candidate: LenientRedemptionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRedemptionTiers(store: LenientRedemptionTierStore, query: LenientRedemptionTierQuery): LenientRedemptionTier[] {
  return query.apply(store.list());
}
