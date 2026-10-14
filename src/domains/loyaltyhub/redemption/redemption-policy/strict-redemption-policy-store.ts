import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictRedemptionPolicy } from "./strict-redemption-policy.js";

/** Keeps strict redemption policies by code. */
export interface StrictRedemptionPolicyStore {
  find(code: string): StrictRedemptionPolicy | undefined;
  save(item: StrictRedemptionPolicy): void;
  remove(code: string): boolean;
  list(): StrictRedemptionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictRedemptionPolicyStore implements StrictRedemptionPolicyStore {
  items: Map<string, StrictRedemptionPolicy>;
  order: string[];

  constructor(items: Map<string, StrictRedemptionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictRedemptionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictRedemptionPolicy): void {
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

  list(): StrictRedemptionPolicy[] {
    const out: StrictRedemptionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictRedemptionPolicyStore(): StrictRedemptionPolicyStore {
  return new MemoryStrictRedemptionPolicyStore(new Map<string, StrictRedemptionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictRedemptionPolicyStore implements StrictRedemptionPolicyStore {
  inner: StrictRedemptionPolicyStore;
  cache: cache.TtlCache<StrictRedemptionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictRedemptionPolicyStore,
    cacheValue: cache.TtlCache<StrictRedemptionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictRedemptionPolicy | undefined {
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

  save(item: StrictRedemptionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictRedemptionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedStrictRedemptionPolicyStore(inner: StrictRedemptionPolicyStore, ttl: number, clockValue: clock.Clock): StrictRedemptionPolicyStore {
  return new CachedStrictRedemptionPolicyStore(
    inner,
    cache.newTtlCache<StrictRedemptionPolicy>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict redemption policies. Empty fields match all. */
export class StrictRedemptionPolicyQuery {
  category: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minVersion: number, statuses: string[], limit: number) {
    this.category = category;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictRedemptionPolicy): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictRedemptionPolicy[]): StrictRedemptionPolicy[] {
    const matched = collections.filter(items, (candidate: StrictRedemptionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictRedemptionPolicies(store: StrictRedemptionPolicyStore, query: StrictRedemptionPolicyQuery): StrictRedemptionPolicy[] {
  return query.apply(store.list());
}
