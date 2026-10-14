import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionPolicy } from "./subscription-policy.js";

/** Keeps subscription policies by code. */
export interface SubscriptionPolicyStore {
  find(code: string): SubscriptionPolicy | undefined;
  save(item: SubscriptionPolicy): void;
  remove(code: string): boolean;
  list(): SubscriptionPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionPolicyStore implements SubscriptionPolicyStore {
  items: Map<string, SubscriptionPolicy>;
  order: string[];

  constructor(items: Map<string, SubscriptionPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionPolicy): void {
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

  list(): SubscriptionPolicy[] {
    const out: SubscriptionPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionPolicyStore(): SubscriptionPolicyStore {
  return new MemorySubscriptionPolicyStore(new Map<string, SubscriptionPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionPolicyStore implements SubscriptionPolicyStore {
  inner: SubscriptionPolicyStore;
  cache: cache.TtlCache<SubscriptionPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionPolicyStore,
    cacheValue: cache.TtlCache<SubscriptionPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionPolicy | undefined {
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

  save(item: SubscriptionPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionPolicy[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionPolicyStore(inner: SubscriptionPolicyStore, ttl: number, clockValue: clock.Clock): SubscriptionPolicyStore {
  return new CachedSubscriptionPolicyStore(inner, cache.newTtlCache<SubscriptionPolicy>(256, ttl, clockValue), 0, 0);
}

/** Selects subscription policies. Empty fields match all. */
export class SubscriptionPolicyQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionPolicy): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionPolicy[]): SubscriptionPolicy[] {
    const matched = collections.filter(items, (candidate: SubscriptionPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionPolicies(store: SubscriptionPolicyStore, query: SubscriptionPolicyQuery): SubscriptionPolicy[] {
  return query.apply(store.list());
}
