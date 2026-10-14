import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionTier } from "./retention-tier.js";

/** Keeps retention tiers by code. */
export interface RetentionTierStore {
  find(code: string): RetentionTier | undefined;
  save(item: RetentionTier): void;
  remove(code: string): boolean;
  list(): RetentionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionTierStore implements RetentionTierStore {
  items: Map<string, RetentionTier>;
  order: string[];

  constructor(items: Map<string, RetentionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionTier): void {
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

  list(): RetentionTier[] {
    const out: RetentionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionTierStore(): RetentionTierStore {
  return new MemoryRetentionTierStore(new Map<string, RetentionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionTierStore implements RetentionTierStore {
  inner: RetentionTierStore;
  cache: cache.TtlCache<RetentionTier>;
  hits: number;
  misses: number;

  constructor(inner: RetentionTierStore, cacheValue: cache.TtlCache<RetentionTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionTier | undefined {
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

  save(item: RetentionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionTier[] {
    return this.inner.list();
  }
}

export function newCachedRetentionTierStore(inner: RetentionTierStore, ttl: number, clockValue: clock.Clock): RetentionTierStore {
  return new CachedRetentionTierStore(inner, cache.newTtlCache<RetentionTier>(128, ttl, clockValue), 0, 0);
}

/** Selects retention tiers. Empty fields match all. */
export class RetentionTierQuery {
  channel: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minStartsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionTier): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionTier[]): RetentionTier[] {
    const matched = collections.filter(items, (candidate: RetentionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionTiers(store: RetentionTierStore, query: RetentionTierQuery): RetentionTier[] {
  return query.apply(store.list());
}
