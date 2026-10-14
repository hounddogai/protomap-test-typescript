import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionGroup } from "./redemption-group.js";

/** Keeps redemption groups by code. */
export interface RedemptionGroupStore {
  find(code: string): RedemptionGroup | undefined;
  save(item: RedemptionGroup): void;
  remove(code: string): boolean;
  list(): RedemptionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionGroupStore implements RedemptionGroupStore {
  items: Map<string, RedemptionGroup>;
  order: string[];

  constructor(items: Map<string, RedemptionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionGroup): void {
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

  list(): RedemptionGroup[] {
    const out: RedemptionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionGroupStore(): RedemptionGroupStore {
  return new MemoryRedemptionGroupStore(new Map<string, RedemptionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionGroupStore implements RedemptionGroupStore {
  inner: RedemptionGroupStore;
  cache: cache.TtlCache<RedemptionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionGroupStore,
    cacheValue: cache.TtlCache<RedemptionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionGroup | undefined {
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

  save(item: RedemptionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionGroup[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionGroupStore(inner: RedemptionGroupStore, ttl: number, clockValue: clock.Clock): RedemptionGroupStore {
  return new CachedRedemptionGroupStore(inner, cache.newTtlCache<RedemptionGroup>(64, ttl, clockValue), 0, 0);
}

/** Selects redemption groups. Empty fields match all. */
export class RedemptionGroupQuery {
  unit: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRetries: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionGroup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionGroup[]): RedemptionGroup[] {
    const matched = collections.filter(items, (candidate: RedemptionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionGroups(store: RedemptionGroupStore, query: RedemptionGroupQuery): RedemptionGroup[] {
  return query.apply(store.list());
}
