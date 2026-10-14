import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallWindow } from "./paywall-window.js";

/** Keeps paywall windows by code. */
export interface PaywallWindowStore {
  find(code: string): PaywallWindow | undefined;
  save(item: PaywallWindow): void;
  remove(code: string): boolean;
  list(): PaywallWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallWindowStore implements PaywallWindowStore {
  items: Map<string, PaywallWindow>;
  order: string[];

  constructor(items: Map<string, PaywallWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallWindow): void {
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

  list(): PaywallWindow[] {
    const out: PaywallWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallWindowStore(): PaywallWindowStore {
  return new MemoryPaywallWindowStore(new Map<string, PaywallWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallWindowStore implements PaywallWindowStore {
  inner: PaywallWindowStore;
  cache: cache.TtlCache<PaywallWindow>;
  hits: number;
  misses: number;

  constructor(inner: PaywallWindowStore, cacheValue: cache.TtlCache<PaywallWindow>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallWindow | undefined {
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

  save(item: PaywallWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallWindow[] {
    return this.inner.list();
  }
}

export function newCachedPaywallWindowStore(inner: PaywallWindowStore, ttl: number, clockValue: clock.Clock): PaywallWindowStore {
  return new CachedPaywallWindowStore(inner, cache.newTtlCache<PaywallWindow>(1024, ttl, clockValue), 0, 0);
}

/** Selects paywall windows. Empty fields match all. */
export class PaywallWindowQuery {
  region: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minLimit: number, statuses: string[], limit: number) {
    this.region = region;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallWindow): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallWindow[]): PaywallWindow[] {
    const matched = collections.filter(items, (candidate: PaywallWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallWindows(store: PaywallWindowStore, query: PaywallWindowQuery): PaywallWindow[] {
  return query.apply(store.list());
}
