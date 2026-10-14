import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionTier } from "./suppression-tier.js";

/** Keeps suppression tiers by code. */
export interface SuppressionTierStore {
  find(code: string): SuppressionTier | undefined;
  save(item: SuppressionTier): void;
  remove(code: string): boolean;
  list(): SuppressionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionTierStore implements SuppressionTierStore {
  items: Map<string, SuppressionTier>;
  order: string[];

  constructor(items: Map<string, SuppressionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionTier): void {
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

  list(): SuppressionTier[] {
    const out: SuppressionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionTierStore(): SuppressionTierStore {
  return new MemorySuppressionTierStore(new Map<string, SuppressionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionTierStore implements SuppressionTierStore {
  inner: SuppressionTierStore;
  cache: cache.TtlCache<SuppressionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionTierStore,
    cacheValue: cache.TtlCache<SuppressionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionTier | undefined {
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

  save(item: SuppressionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionTier[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionTierStore(inner: SuppressionTierStore, ttl: number, clockValue: clock.Clock): SuppressionTierStore {
  return new CachedSuppressionTierStore(inner, cache.newTtlCache<SuppressionTier>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression tiers. Empty fields match all. */
export class SuppressionTierQuery {
  utmSource: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionTier): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionTier[]): SuppressionTier[] {
    const matched = collections.filter(items, (candidate: SuppressionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionTiers(store: SuppressionTierStore, query: SuppressionTierQuery): SuppressionTier[] {
  return query.apply(store.list());
}
