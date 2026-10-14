import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallClaim } from "./paywall-claim.js";

/** Keeps paywall claims by code. */
export interface PaywallClaimStore {
  find(code: string): PaywallClaim | undefined;
  save(item: PaywallClaim): void;
  remove(code: string): boolean;
  list(): PaywallClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallClaimStore implements PaywallClaimStore {
  items: Map<string, PaywallClaim>;
  order: string[];

  constructor(items: Map<string, PaywallClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallClaim): void {
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

  list(): PaywallClaim[] {
    const out: PaywallClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallClaimStore(): PaywallClaimStore {
  return new MemoryPaywallClaimStore(new Map<string, PaywallClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallClaimStore implements PaywallClaimStore {
  inner: PaywallClaimStore;
  cache: cache.TtlCache<PaywallClaim>;
  hits: number;
  misses: number;

  constructor(inner: PaywallClaimStore, cacheValue: cache.TtlCache<PaywallClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallClaim | undefined {
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

  save(item: PaywallClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallClaim[] {
    return this.inner.list();
  }
}

export function newCachedPaywallClaimStore(inner: PaywallClaimStore, ttl: number, clockValue: clock.Clock): PaywallClaimStore {
  return new CachedPaywallClaimStore(inner, cache.newTtlCache<PaywallClaim>(1024, ttl, clockValue), 0, 0);
}

/** Selects paywall claims. Empty fields match all. */
export class PaywallClaimQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallClaim[]): PaywallClaim[] {
    const matched = collections.filter(items, (candidate: PaywallClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallClaims(store: PaywallClaimStore, query: PaywallClaimQuery): PaywallClaim[] {
  return query.apply(store.list());
}
