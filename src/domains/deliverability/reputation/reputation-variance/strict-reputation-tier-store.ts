import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReputationTier } from "./strict-reputation-tier.js";

/** Keeps strict reputation tiers by code. */
export interface StrictReputationTierStore {
  find(code: string): StrictReputationTier | undefined;
  save(item: StrictReputationTier): void;
  remove(code: string): boolean;
  list(): StrictReputationTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReputationTierStore implements StrictReputationTierStore {
  items: Map<string, StrictReputationTier>;
  order: string[];

  constructor(items: Map<string, StrictReputationTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReputationTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReputationTier): void {
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

  list(): StrictReputationTier[] {
    const out: StrictReputationTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReputationTierStore(): StrictReputationTierStore {
  return new MemoryStrictReputationTierStore(new Map<string, StrictReputationTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReputationTierStore implements StrictReputationTierStore {
  inner: StrictReputationTierStore;
  cache: cache.TtlCache<StrictReputationTier>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReputationTierStore,
    cacheValue: cache.TtlCache<StrictReputationTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReputationTier | undefined {
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

  save(item: StrictReputationTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReputationTier[] {
    return this.inner.list();
  }
}

export function newCachedStrictReputationTierStore(inner: StrictReputationTierStore, ttl: number, clockValue: clock.Clock): StrictReputationTierStore {
  return new CachedStrictReputationTierStore(
    inner,
    cache.newTtlCache<StrictReputationTier>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict reputation tiers. Empty fields match all. */
export class StrictReputationTierQuery {
  label: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minImpressions: number, statuses: string[], limit: number) {
    this.label = label;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReputationTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReputationTier[]): StrictReputationTier[] {
    const matched = collections.filter(items, (candidate: StrictReputationTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReputationTiers(store: StrictReputationTierStore, query: StrictReputationTierQuery): StrictReputationTier[] {
  return query.apply(store.list());
}
