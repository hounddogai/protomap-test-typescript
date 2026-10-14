import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPaywallClaim } from "./manual-paywall-claim.js";

/** Keeps manual paywall claims by code. */
export interface ManualPaywallClaimStore {
  find(code: string): ManualPaywallClaim | undefined;
  save(item: ManualPaywallClaim): void;
  remove(code: string): boolean;
  list(): ManualPaywallClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPaywallClaimStore implements ManualPaywallClaimStore {
  items: Map<string, ManualPaywallClaim>;
  order: string[];

  constructor(items: Map<string, ManualPaywallClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPaywallClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPaywallClaim): void {
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

  list(): ManualPaywallClaim[] {
    const out: ManualPaywallClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPaywallClaimStore(): ManualPaywallClaimStore {
  return new MemoryManualPaywallClaimStore(new Map<string, ManualPaywallClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPaywallClaimStore implements ManualPaywallClaimStore {
  inner: ManualPaywallClaimStore;
  cache: cache.TtlCache<ManualPaywallClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPaywallClaimStore,
    cacheValue: cache.TtlCache<ManualPaywallClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPaywallClaim | undefined {
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

  save(item: ManualPaywallClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPaywallClaim[] {
    return this.inner.list();
  }
}

export function newCachedManualPaywallClaimStore(inner: ManualPaywallClaimStore, ttl: number, clockValue: clock.Clock): ManualPaywallClaimStore {
  return new CachedManualPaywallClaimStore(inner, cache.newTtlCache<ManualPaywallClaim>(256, ttl, clockValue), 0, 0);
}

/** Selects manual paywall claims. Empty fields match all. */
export class ManualPaywallClaimQuery {
  category: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMaximum: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPaywallClaim): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPaywallClaim[]): ManualPaywallClaim[] {
    const matched = collections.filter(items, (candidate: ManualPaywallClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPaywallClaims(store: ManualPaywallClaimStore, query: ManualPaywallClaimQuery): ManualPaywallClaim[] {
  return query.apply(store.list());
}
