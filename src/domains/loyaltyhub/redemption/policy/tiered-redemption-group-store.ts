import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRedemptionGroup } from "./tiered-redemption-group.js";

/** Keeps tiered redemption groups by code. */
export interface TieredRedemptionGroupStore {
  find(code: string): TieredRedemptionGroup | undefined;
  save(item: TieredRedemptionGroup): void;
  remove(code: string): boolean;
  list(): TieredRedemptionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRedemptionGroupStore implements TieredRedemptionGroupStore {
  items: Map<string, TieredRedemptionGroup>;
  order: string[];

  constructor(items: Map<string, TieredRedemptionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRedemptionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRedemptionGroup): void {
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

  list(): TieredRedemptionGroup[] {
    const out: TieredRedemptionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRedemptionGroupStore(): TieredRedemptionGroupStore {
  return new MemoryTieredRedemptionGroupStore(new Map<string, TieredRedemptionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRedemptionGroupStore implements TieredRedemptionGroupStore {
  inner: TieredRedemptionGroupStore;
  cache: cache.TtlCache<TieredRedemptionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRedemptionGroupStore,
    cacheValue: cache.TtlCache<TieredRedemptionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRedemptionGroup | undefined {
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

  save(item: TieredRedemptionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRedemptionGroup[] {
    return this.inner.list();
  }
}

export function newCachedTieredRedemptionGroupStore(inner: TieredRedemptionGroupStore, ttl: number, clockValue: clock.Clock): TieredRedemptionGroupStore {
  return new CachedTieredRedemptionGroupStore(
    inner,
    cache.newTtlCache<TieredRedemptionGroup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered redemption groups. Empty fields match all. */
export class TieredRedemptionGroupQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRedemptionGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRedemptionGroup[]): TieredRedemptionGroup[] {
    const matched = collections.filter(items, (candidate: TieredRedemptionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRedemptionGroups(store: TieredRedemptionGroupStore, query: TieredRedemptionGroupQuery): TieredRedemptionGroup[] {
  return query.apply(store.list());
}
