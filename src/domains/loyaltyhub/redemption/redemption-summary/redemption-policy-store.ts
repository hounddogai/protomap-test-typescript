import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionPolicy } from "./redemption-policy.js";

/** Keeps redemption policies by code. */
export interface RedemptionPolicyStore {
  find(code: string): RedemptionPolicy | undefined;
  save(item: RedemptionPolicy): void;
  remove(code: string): boolean;
  list(): RedemptionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionPolicyStore implements RedemptionPolicyStore {
  items: Map<string, RedemptionPolicy>;
  order: string[];

  constructor(items: Map<string, RedemptionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionPolicy): void {
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

  list(): RedemptionPolicy[] {
    const out: RedemptionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionPolicyStore(): RedemptionPolicyStore {
  return new MemoryRedemptionPolicyStore(new Map<string, RedemptionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionPolicyStore implements RedemptionPolicyStore {
  inner: RedemptionPolicyStore;
  cache: cache.TtlCache<RedemptionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionPolicyStore,
    cacheValue: cache.TtlCache<RedemptionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionPolicy | undefined {
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

  save(item: RedemptionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionPolicyStore(inner: RedemptionPolicyStore, ttl: number, clockValue: clock.Clock): RedemptionPolicyStore {
  return new CachedRedemptionPolicyStore(inner, cache.newTtlCache<RedemptionPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects redemption policies. Empty fields match all. */
export class RedemptionPolicyQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionPolicy): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionPolicy[]): RedemptionPolicy[] {
    const matched = collections.filter(items, (candidate: RedemptionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionPolicies(store: RedemptionPolicyStore, query: RedemptionPolicyQuery): RedemptionPolicy[] {
  return query.apply(store.list());
}
