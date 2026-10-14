import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallTarget } from "./paywall-target.js";

/** Keeps paywall targets by code. */
export interface PaywallTargetStore {
  find(code: string): PaywallTarget | undefined;
  save(item: PaywallTarget): void;
  remove(code: string): boolean;
  list(): PaywallTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallTargetStore implements PaywallTargetStore {
  items: Map<string, PaywallTarget>;
  order: string[];

  constructor(items: Map<string, PaywallTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallTarget): void {
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

  list(): PaywallTarget[] {
    const out: PaywallTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallTargetStore(): PaywallTargetStore {
  return new MemoryPaywallTargetStore(new Map<string, PaywallTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallTargetStore implements PaywallTargetStore {
  inner: PaywallTargetStore;
  cache: cache.TtlCache<PaywallTarget>;
  hits: number;
  misses: number;

  constructor(inner: PaywallTargetStore, cacheValue: cache.TtlCache<PaywallTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallTarget | undefined {
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

  save(item: PaywallTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallTarget[] {
    return this.inner.list();
  }
}

export function newCachedPaywallTargetStore(inner: PaywallTargetStore, ttl: number, clockValue: clock.Clock): PaywallTargetStore {
  return new CachedPaywallTargetStore(inner, cache.newTtlCache<PaywallTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects paywall targets. Empty fields match all. */
export class PaywallTargetQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallTarget): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallTarget[]): PaywallTarget[] {
    const matched = collections.filter(items, (candidate: PaywallTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallTargets(store: PaywallTargetStore, query: PaywallTargetQuery): PaywallTarget[] {
  return query.apply(store.list());
}
