import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallRollup } from "./paywall-rollup.js";

/** Keeps paywall rollups by code. */
export interface PaywallRollupStore {
  find(code: string): PaywallRollup | undefined;
  save(item: PaywallRollup): void;
  remove(code: string): boolean;
  list(): PaywallRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallRollupStore implements PaywallRollupStore {
  items: Map<string, PaywallRollup>;
  order: string[];

  constructor(items: Map<string, PaywallRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallRollup): void {
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

  list(): PaywallRollup[] {
    const out: PaywallRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallRollupStore(): PaywallRollupStore {
  return new MemoryPaywallRollupStore(new Map<string, PaywallRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallRollupStore implements PaywallRollupStore {
  inner: PaywallRollupStore;
  cache: cache.TtlCache<PaywallRollup>;
  hits: number;
  misses: number;

  constructor(inner: PaywallRollupStore, cacheValue: cache.TtlCache<PaywallRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallRollup | undefined {
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

  save(item: PaywallRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallRollup[] {
    return this.inner.list();
  }
}

export function newCachedPaywallRollupStore(inner: PaywallRollupStore, ttl: number, clockValue: clock.Clock): PaywallRollupStore {
  return new CachedPaywallRollupStore(inner, cache.newTtlCache<PaywallRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects paywall rollups. Empty fields match all. */
export class PaywallRollupQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallRollup[]): PaywallRollup[] {
    const matched = collections.filter(items, (candidate: PaywallRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallRollups(store: PaywallRollupStore, query: PaywallRollupQuery): PaywallRollup[] {
  return query.apply(store.list());
}
