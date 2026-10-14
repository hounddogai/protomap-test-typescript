import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallPolicy } from "./paywall-policy.js";

/** Keeps paywall policies by code. */
export interface PaywallPolicyStore {
  find(code: string): PaywallPolicy | undefined;
  save(item: PaywallPolicy): void;
  remove(code: string): boolean;
  list(): PaywallPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallPolicyStore implements PaywallPolicyStore {
  items: Map<string, PaywallPolicy>;
  order: string[];

  constructor(items: Map<string, PaywallPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallPolicy): void {
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

  list(): PaywallPolicy[] {
    const out: PaywallPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallPolicyStore(): PaywallPolicyStore {
  return new MemoryPaywallPolicyStore(new Map<string, PaywallPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallPolicyStore implements PaywallPolicyStore {
  inner: PaywallPolicyStore;
  cache: cache.TtlCache<PaywallPolicy>;
  hits: number;
  misses: number;

  constructor(inner: PaywallPolicyStore, cacheValue: cache.TtlCache<PaywallPolicy>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallPolicy | undefined {
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

  save(item: PaywallPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallPolicy[] {
    return this.inner.list();
  }
}

export function newCachedPaywallPolicyStore(inner: PaywallPolicyStore, ttl: number, clockValue: clock.Clock): PaywallPolicyStore {
  return new CachedPaywallPolicyStore(inner, cache.newTtlCache<PaywallPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects paywall policies. Empty fields match all. */
export class PaywallPolicyQuery {
  locale: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRatio: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallPolicy): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallPolicy[]): PaywallPolicy[] {
    const matched = collections.filter(items, (candidate: PaywallPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallPolicies(store: PaywallPolicyStore, query: PaywallPolicyQuery): PaywallPolicy[] {
  return query.apply(store.list());
}
