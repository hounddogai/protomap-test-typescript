import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDomainTier } from "./scheduled-domain-tier.js";

/** Keeps scheduled domain tiers by code. */
export interface ScheduledDomainTierStore {
  find(code: string): ScheduledDomainTier | undefined;
  save(item: ScheduledDomainTier): void;
  remove(code: string): boolean;
  list(): ScheduledDomainTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDomainTierStore implements ScheduledDomainTierStore {
  items: Map<string, ScheduledDomainTier>;
  order: string[];

  constructor(items: Map<string, ScheduledDomainTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDomainTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDomainTier): void {
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

  list(): ScheduledDomainTier[] {
    const out: ScheduledDomainTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDomainTierStore(): ScheduledDomainTierStore {
  return new MemoryScheduledDomainTierStore(new Map<string, ScheduledDomainTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDomainTierStore implements ScheduledDomainTierStore {
  inner: ScheduledDomainTierStore;
  cache: cache.TtlCache<ScheduledDomainTier>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDomainTierStore,
    cacheValue: cache.TtlCache<ScheduledDomainTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDomainTier | undefined {
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

  save(item: ScheduledDomainTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDomainTier[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDomainTierStore(inner: ScheduledDomainTierStore, ttl: number, clockValue: clock.Clock): ScheduledDomainTierStore {
  return new CachedScheduledDomainTierStore(inner, cache.newTtlCache<ScheduledDomainTier>(64, ttl, clockValue), 0, 0);
}

/** Selects scheduled domain tiers. Empty fields match all. */
export class ScheduledDomainTierQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDomainTier): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDomainTier[]): ScheduledDomainTier[] {
    const matched = collections.filter(items, (candidate: ScheduledDomainTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDomainTiers(store: ScheduledDomainTierStore, query: ScheduledDomainTierQuery): ScheduledDomainTier[] {
  return query.apply(store.list());
}
