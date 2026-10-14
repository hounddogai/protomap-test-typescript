import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientPostTier } from "./lenient-post-tier.js";

/** Keeps lenient post tiers by code. */
export interface LenientPostTierStore {
  find(code: string): LenientPostTier | undefined;
  save(item: LenientPostTier): void;
  remove(code: string): boolean;
  list(): LenientPostTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientPostTierStore implements LenientPostTierStore {
  items: Map<string, LenientPostTier>;
  order: string[];

  constructor(items: Map<string, LenientPostTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientPostTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientPostTier): void {
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

  list(): LenientPostTier[] {
    const out: LenientPostTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientPostTierStore(): LenientPostTierStore {
  return new MemoryLenientPostTierStore(new Map<string, LenientPostTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientPostTierStore implements LenientPostTierStore {
  inner: LenientPostTierStore;
  cache: cache.TtlCache<LenientPostTier>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientPostTierStore,
    cacheValue: cache.TtlCache<LenientPostTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientPostTier | undefined {
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

  save(item: LenientPostTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientPostTier[] {
    return this.inner.list();
  }
}

export function newCachedLenientPostTierStore(inner: LenientPostTierStore, ttl: number, clockValue: clock.Clock): LenientPostTierStore {
  return new CachedLenientPostTierStore(inner, cache.newTtlCache<LenientPostTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects lenient post tiers. Empty fields match all. */
export class LenientPostTierQuery {
  channel: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minImpressions: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientPostTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientPostTier[]): LenientPostTier[] {
    const matched = collections.filter(items, (candidate: LenientPostTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientPostTiers(store: LenientPostTierStore, query: LenientPostTierQuery): LenientPostTier[] {
  return query.apply(store.list());
}
