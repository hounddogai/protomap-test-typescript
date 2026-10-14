import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutProfile } from "./payout-profile.js";

/** Keeps payout profiles by code. */
export interface PayoutProfileStore {
  find(code: string): PayoutProfile | undefined;
  save(item: PayoutProfile): void;
  remove(code: string): boolean;
  list(): PayoutProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutProfileStore implements PayoutProfileStore {
  items: Map<string, PayoutProfile>;
  order: string[];

  constructor(items: Map<string, PayoutProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutProfile): void {
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

  list(): PayoutProfile[] {
    const out: PayoutProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutProfileStore(): PayoutProfileStore {
  return new MemoryPayoutProfileStore(new Map<string, PayoutProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutProfileStore implements PayoutProfileStore {
  inner: PayoutProfileStore;
  cache: cache.TtlCache<PayoutProfile>;
  hits: number;
  misses: number;

  constructor(inner: PayoutProfileStore, cacheValue: cache.TtlCache<PayoutProfile>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutProfile | undefined {
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

  save(item: PayoutProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutProfile[] {
    return this.inner.list();
  }
}

export function newCachedPayoutProfileStore(inner: PayoutProfileStore, ttl: number, clockValue: clock.Clock): PayoutProfileStore {
  return new CachedPayoutProfileStore(inner, cache.newTtlCache<PayoutProfile>(128, ttl, clockValue), 0, 0);
}

/** Selects payout profiles. Empty fields match all. */
export class PayoutProfileQuery {
  utmSource: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minConversionRate: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutProfile): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutProfile[]): PayoutProfile[] {
    const matched = collections.filter(items, (candidate: PayoutProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutProfiles(store: PayoutProfileStore, query: PayoutProfileQuery): PayoutProfile[] {
  return query.apply(store.list());
}
