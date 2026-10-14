import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallGroup } from "./paywall-group.js";

/** Keeps paywall groups by code. */
export interface PaywallGroupStore {
  find(code: string): PaywallGroup | undefined;
  save(item: PaywallGroup): void;
  remove(code: string): boolean;
  list(): PaywallGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallGroupStore implements PaywallGroupStore {
  items: Map<string, PaywallGroup>;
  order: string[];

  constructor(items: Map<string, PaywallGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallGroup): void {
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

  list(): PaywallGroup[] {
    const out: PaywallGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallGroupStore(): PaywallGroupStore {
  return new MemoryPaywallGroupStore(new Map<string, PaywallGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallGroupStore implements PaywallGroupStore {
  inner: PaywallGroupStore;
  cache: cache.TtlCache<PaywallGroup>;
  hits: number;
  misses: number;

  constructor(inner: PaywallGroupStore, cacheValue: cache.TtlCache<PaywallGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallGroup | undefined {
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

  save(item: PaywallGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallGroup[] {
    return this.inner.list();
  }
}

export function newCachedPaywallGroupStore(inner: PaywallGroupStore, ttl: number, clockValue: clock.Clock): PaywallGroupStore {
  return new CachedPaywallGroupStore(inner, cache.newTtlCache<PaywallGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall groups. Empty fields match all. */
export class PaywallGroupQuery {
  channel: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minFloorValue: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallGroup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallGroup[]): PaywallGroup[] {
    const matched = collections.filter(items, (candidate: PaywallGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallGroups(store: PaywallGroupStore, query: PaywallGroupQuery): PaywallGroup[] {
  return query.apply(store.list());
}
