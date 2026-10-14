import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimarySuppressionTier } from "./primary-suppression-tier.js";

/** Keeps primary suppression tiers by code. */
export interface PrimarySuppressionTierStore {
  find(code: string): PrimarySuppressionTier | undefined;
  save(item: PrimarySuppressionTier): void;
  remove(code: string): boolean;
  list(): PrimarySuppressionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimarySuppressionTierStore implements PrimarySuppressionTierStore {
  items: Map<string, PrimarySuppressionTier>;
  order: string[];

  constructor(items: Map<string, PrimarySuppressionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimarySuppressionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimarySuppressionTier): void {
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

  list(): PrimarySuppressionTier[] {
    const out: PrimarySuppressionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimarySuppressionTierStore(): PrimarySuppressionTierStore {
  return new MemoryPrimarySuppressionTierStore(new Map<string, PrimarySuppressionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimarySuppressionTierStore implements PrimarySuppressionTierStore {
  inner: PrimarySuppressionTierStore;
  cache: cache.TtlCache<PrimarySuppressionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimarySuppressionTierStore,
    cacheValue: cache.TtlCache<PrimarySuppressionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimarySuppressionTier | undefined {
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

  save(item: PrimarySuppressionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimarySuppressionTier[] {
    return this.inner.list();
  }
}

export function newCachedPrimarySuppressionTierStore(inner: PrimarySuppressionTierStore, ttl: number, clockValue: clock.Clock): PrimarySuppressionTierStore {
  return new CachedPrimarySuppressionTierStore(
    inner,
    cache.newTtlCache<PrimarySuppressionTier>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary suppression tiers. Empty fields match all. */
export class PrimarySuppressionTierQuery {
  region: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRevision: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimarySuppressionTier): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimarySuppressionTier[]): PrimarySuppressionTier[] {
    const matched = collections.filter(items, (candidate: PrimarySuppressionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimarySuppressionTiers(store: PrimarySuppressionTierStore, query: PrimarySuppressionTierQuery): PrimarySuppressionTier[] {
  return query.apply(store.list());
}
