import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintTier } from "./complaint-tier.js";

/** Keeps complaint tiers by code. */
export interface ComplaintTierStore {
  find(code: string): ComplaintTier | undefined;
  save(item: ComplaintTier): void;
  remove(code: string): boolean;
  list(): ComplaintTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintTierStore implements ComplaintTierStore {
  items: Map<string, ComplaintTier>;
  order: string[];

  constructor(items: Map<string, ComplaintTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintTier): void {
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

  list(): ComplaintTier[] {
    const out: ComplaintTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintTierStore(): ComplaintTierStore {
  return new MemoryComplaintTierStore(new Map<string, ComplaintTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintTierStore implements ComplaintTierStore {
  inner: ComplaintTierStore;
  cache: cache.TtlCache<ComplaintTier>;
  hits: number;
  misses: number;

  constructor(inner: ComplaintTierStore, cacheValue: cache.TtlCache<ComplaintTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintTier | undefined {
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

  save(item: ComplaintTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintTier[] {
    return this.inner.list();
  }
}

export function newCachedComplaintTierStore(inner: ComplaintTierStore, ttl: number, clockValue: clock.Clock): ComplaintTierStore {
  return new CachedComplaintTierStore(inner, cache.newTtlCache<ComplaintTier>(64, ttl, clockValue), 0, 0);
}

/** Selects complaint tiers. Empty fields match all. */
export class ComplaintTierQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintTier[]): ComplaintTier[] {
    const matched = collections.filter(items, (candidate: ComplaintTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintTiers(store: ComplaintTierStore, query: ComplaintTierQuery): ComplaintTier[] {
  return query.apply(store.list());
}
