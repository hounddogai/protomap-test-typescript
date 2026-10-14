import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalRedemptionGroup } from "./regional-redemption-group.js";

/** Keeps regional redemption groups by code. */
export interface RegionalRedemptionGroupStore {
  find(code: string): RegionalRedemptionGroup | undefined;
  save(item: RegionalRedemptionGroup): void;
  remove(code: string): boolean;
  list(): RegionalRedemptionGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalRedemptionGroupStore implements RegionalRedemptionGroupStore {
  items: Map<string, RegionalRedemptionGroup>;
  order: string[];

  constructor(items: Map<string, RegionalRedemptionGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalRedemptionGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalRedemptionGroup): void {
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

  list(): RegionalRedemptionGroup[] {
    const out: RegionalRedemptionGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalRedemptionGroupStore(): RegionalRedemptionGroupStore {
  return new MemoryRegionalRedemptionGroupStore(new Map<string, RegionalRedemptionGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalRedemptionGroupStore implements RegionalRedemptionGroupStore {
  inner: RegionalRedemptionGroupStore;
  cache: cache.TtlCache<RegionalRedemptionGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalRedemptionGroupStore,
    cacheValue: cache.TtlCache<RegionalRedemptionGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalRedemptionGroup | undefined {
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

  save(item: RegionalRedemptionGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalRedemptionGroup[] {
    return this.inner.list();
  }
}

export function newCachedRegionalRedemptionGroupStore(inner: RegionalRedemptionGroupStore, ttl: number, clockValue: clock.Clock): RegionalRedemptionGroupStore {
  return new CachedRegionalRedemptionGroupStore(
    inner,
    cache.newTtlCache<RegionalRedemptionGroup>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional redemption groups. Empty fields match all. */
export class RegionalRedemptionGroupQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalRedemptionGroup): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalRedemptionGroup[]): RegionalRedemptionGroup[] {
    const matched = collections.filter(items, (candidate: RegionalRedemptionGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalRedemptionGroups(store: RegionalRedemptionGroupStore, query: RegionalRedemptionGroupQuery): RegionalRedemptionGroup[] {
  return query.apply(store.list());
}
