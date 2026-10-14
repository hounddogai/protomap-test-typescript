import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveProofTier } from "./adaptive-proof-tier.js";

/** Keeps adaptive proof tiers by code. */
export interface AdaptiveProofTierStore {
  find(code: string): AdaptiveProofTier | undefined;
  save(item: AdaptiveProofTier): void;
  remove(code: string): boolean;
  list(): AdaptiveProofTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveProofTierStore implements AdaptiveProofTierStore {
  items: Map<string, AdaptiveProofTier>;
  order: string[];

  constructor(items: Map<string, AdaptiveProofTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveProofTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveProofTier): void {
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

  list(): AdaptiveProofTier[] {
    const out: AdaptiveProofTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveProofTierStore(): AdaptiveProofTierStore {
  return new MemoryAdaptiveProofTierStore(new Map<string, AdaptiveProofTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveProofTierStore implements AdaptiveProofTierStore {
  inner: AdaptiveProofTierStore;
  cache: cache.TtlCache<AdaptiveProofTier>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveProofTierStore,
    cacheValue: cache.TtlCache<AdaptiveProofTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveProofTier | undefined {
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

  save(item: AdaptiveProofTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveProofTier[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveProofTierStore(inner: AdaptiveProofTierStore, ttl: number, clockValue: clock.Clock): AdaptiveProofTierStore {
  return new CachedAdaptiveProofTierStore(inner, cache.newTtlCache<AdaptiveProofTier>(512, ttl, clockValue), 0, 0);
}

/** Selects adaptive proof tiers. Empty fields match all. */
export class AdaptiveProofTierQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveProofTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveProofTier[]): AdaptiveProofTier[] {
    const matched = collections.filter(items, (candidate: AdaptiveProofTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveProofTiers(store: AdaptiveProofTierStore, query: AdaptiveProofTierQuery): AdaptiveProofTier[] {
  return query.apply(store.list());
}
