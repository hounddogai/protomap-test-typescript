import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionMapping } from "./subscription-mapping.js";

/** Keeps subscription mappings by code. */
export interface SubscriptionMappingStore {
  find(code: string): SubscriptionMapping | undefined;
  save(item: SubscriptionMapping): void;
  remove(code: string): boolean;
  list(): SubscriptionMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionMappingStore implements SubscriptionMappingStore {
  items: Map<string, SubscriptionMapping>;
  order: string[];

  constructor(items: Map<string, SubscriptionMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionMapping): void {
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

  list(): SubscriptionMapping[] {
    const out: SubscriptionMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionMappingStore(): SubscriptionMappingStore {
  return new MemorySubscriptionMappingStore(new Map<string, SubscriptionMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionMappingStore implements SubscriptionMappingStore {
  inner: SubscriptionMappingStore;
  cache: cache.TtlCache<SubscriptionMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionMappingStore,
    cacheValue: cache.TtlCache<SubscriptionMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionMapping | undefined {
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

  save(item: SubscriptionMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionMapping[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionMappingStore(inner: SubscriptionMappingStore, ttl: number, clockValue: clock.Clock): SubscriptionMappingStore {
  return new CachedSubscriptionMappingStore(inner, cache.newTtlCache<SubscriptionMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects subscription mappings. Empty fields match all. */
export class SubscriptionMappingQuery {
  region: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minScore: number, statuses: string[], limit: number) {
    this.region = region;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionMapping): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionMapping[]): SubscriptionMapping[] {
    const matched = collections.filter(items, (candidate: SubscriptionMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionMappings(store: SubscriptionMappingStore, query: SubscriptionMappingQuery): SubscriptionMapping[] {
  return query.apply(store.list());
}
