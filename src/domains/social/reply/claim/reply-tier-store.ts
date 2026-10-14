import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyTier } from "./reply-tier.js";

/** Keeps reply tiers by code. */
export interface ReplyTierStore {
  find(code: string): ReplyTier | undefined;
  save(item: ReplyTier): void;
  remove(code: string): boolean;
  list(): ReplyTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyTierStore implements ReplyTierStore {
  items: Map<string, ReplyTier>;
  order: string[];

  constructor(items: Map<string, ReplyTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyTier): void {
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

  list(): ReplyTier[] {
    const out: ReplyTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyTierStore(): ReplyTierStore {
  return new MemoryReplyTierStore(new Map<string, ReplyTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyTierStore implements ReplyTierStore {
  inner: ReplyTierStore;
  cache: cache.TtlCache<ReplyTier>;
  hits: number;
  misses: number;

  constructor(inner: ReplyTierStore, cacheValue: cache.TtlCache<ReplyTier>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyTier | undefined {
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

  save(item: ReplyTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyTier[] {
    return this.inner.list();
  }
}

export function newCachedReplyTierStore(inner: ReplyTierStore, ttl: number, clockValue: clock.Clock): ReplyTierStore {
  return new CachedReplyTierStore(inner, cache.newTtlCache<ReplyTier>(512, ttl, clockValue), 0, 0);
}

/** Selects reply tiers. Empty fields match all. */
export class ReplyTierQuery {
  country: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minVersion: number, statuses: string[], limit: number) {
    this.country = country;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyTier): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyTier[]): ReplyTier[] {
    const matched = collections.filter(items, (candidate: ReplyTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyTiers(store: ReplyTierStore, query: ReplyTierQuery): ReplyTier[] {
  return query.apply(store.list());
}
