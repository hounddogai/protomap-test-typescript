import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationTier } from "./activation-tier.js";

/** Keeps activation tiers by code. */
export interface ActivationTierStore {
  find(code: string): ActivationTier | undefined;
  save(item: ActivationTier): void;
  remove(code: string): boolean;
  list(): ActivationTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationTierStore implements ActivationTierStore {
  items: Map<string, ActivationTier>;
  order: string[];

  constructor(items: Map<string, ActivationTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationTier): void {
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

  list(): ActivationTier[] {
    const out: ActivationTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationTierStore(): ActivationTierStore {
  return new MemoryActivationTierStore(new Map<string, ActivationTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationTierStore implements ActivationTierStore {
  inner: ActivationTierStore;
  cache: cache.TtlCache<ActivationTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationTierStore,
    cacheValue: cache.TtlCache<ActivationTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationTier | undefined {
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

  save(item: ActivationTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationTier[] {
    return this.inner.list();
  }
}

export function newCachedActivationTierStore(inner: ActivationTierStore, ttl: number, clockValue: clock.Clock): ActivationTierStore {
  return new CachedActivationTierStore(inner, cache.newTtlCache<ActivationTier>(256, ttl, clockValue), 0, 0);
}

/** Selects activation tiers. Empty fields match all. */
export class ActivationTierQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationTier): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationTier[]): ActivationTier[] {
    const matched = collections.filter(items, (candidate: ActivationTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationTiers(store: ActivationTierStore, query: ActivationTierQuery): ActivationTier[] {
  return query.apply(store.list());
}
