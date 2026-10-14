import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallQuota } from "./paywall-quota.js";

/** Keeps paywall quotas by code. */
export interface PaywallQuotaStore {
  find(code: string): PaywallQuota | undefined;
  save(item: PaywallQuota): void;
  remove(code: string): boolean;
  list(): PaywallQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallQuotaStore implements PaywallQuotaStore {
  items: Map<string, PaywallQuota>;
  order: string[];

  constructor(items: Map<string, PaywallQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallQuota): void {
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

  list(): PaywallQuota[] {
    const out: PaywallQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallQuotaStore(): PaywallQuotaStore {
  return new MemoryPaywallQuotaStore(new Map<string, PaywallQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallQuotaStore implements PaywallQuotaStore {
  inner: PaywallQuotaStore;
  cache: cache.TtlCache<PaywallQuota>;
  hits: number;
  misses: number;

  constructor(inner: PaywallQuotaStore, cacheValue: cache.TtlCache<PaywallQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallQuota | undefined {
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

  save(item: PaywallQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallQuota[] {
    return this.inner.list();
  }
}

export function newCachedPaywallQuotaStore(inner: PaywallQuotaStore, ttl: number, clockValue: clock.Clock): PaywallQuotaStore {
  return new CachedPaywallQuotaStore(inner, cache.newTtlCache<PaywallQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects paywall quotas. Empty fields match all. */
export class PaywallQuotaQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallQuota[]): PaywallQuota[] {
    const matched = collections.filter(items, (candidate: PaywallQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallQuotas(store: PaywallQuotaStore, query: PaywallQuotaQuery): PaywallQuota[] {
  return query.apply(store.list());
}
