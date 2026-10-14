import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutPolicy } from "./payout-policy.js";

/** Keeps payout policies by code. */
export interface PayoutPolicyStore {
  find(code: string): PayoutPolicy | undefined;
  save(item: PayoutPolicy): void;
  remove(code: string): boolean;
  list(): PayoutPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutPolicyStore implements PayoutPolicyStore {
  items: Map<string, PayoutPolicy>;
  order: string[];

  constructor(items: Map<string, PayoutPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutPolicy): void {
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

  list(): PayoutPolicy[] {
    const out: PayoutPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutPolicyStore(): PayoutPolicyStore {
  return new MemoryPayoutPolicyStore(new Map<string, PayoutPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutPolicyStore implements PayoutPolicyStore {
  inner: PayoutPolicyStore;
  cache: cache.TtlCache<PayoutPolicy>;
  hits: number;
  misses: number;

  constructor(inner: PayoutPolicyStore, cacheValue: cache.TtlCache<PayoutPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutPolicy | undefined {
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

  save(item: PayoutPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPayoutPolicyStore(inner: PayoutPolicyStore, ttl: number, clockValue: clock.Clock): PayoutPolicyStore {
  return new CachedPayoutPolicyStore(inner, cache.newTtlCache<PayoutPolicy>(512, ttl, clockValue), 0, 0);
}

/** Selects payout policies. Empty fields match all. */
export class PayoutPolicyQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutPolicy): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutPolicy[]): PayoutPolicy[] {
    const matched = collections.filter(items, (candidate: PayoutPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutPolicies(store: PayoutPolicyStore, query: PayoutPolicyQuery): PayoutPolicy[] {
  return query.apply(store.list());
}
