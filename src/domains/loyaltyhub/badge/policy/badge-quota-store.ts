import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeQuota } from "./badge-quota.js";

/** Keeps badge quotas by code. */
export interface BadgeQuotaStore {
  find(code: string): BadgeQuota | undefined;
  save(item: BadgeQuota): void;
  remove(code: string): boolean;
  list(): BadgeQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeQuotaStore implements BadgeQuotaStore {
  items: Map<string, BadgeQuota>;
  order: string[];

  constructor(items: Map<string, BadgeQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeQuota): void {
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

  list(): BadgeQuota[] {
    const out: BadgeQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeQuotaStore(): BadgeQuotaStore {
  return new MemoryBadgeQuotaStore(new Map<string, BadgeQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeQuotaStore implements BadgeQuotaStore {
  inner: BadgeQuotaStore;
  cache: cache.TtlCache<BadgeQuota>;
  hits: number;
  misses: number;

  constructor(inner: BadgeQuotaStore, cacheValue: cache.TtlCache<BadgeQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeQuota | undefined {
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

  save(item: BadgeQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeQuota[] {
    return this.inner.list();
  }
}

export function newCachedBadgeQuotaStore(inner: BadgeQuotaStore, ttl: number, clockValue: clock.Clock): BadgeQuotaStore {
  return new CachedBadgeQuotaStore(inner, cache.newTtlCache<BadgeQuota>(128, ttl, clockValue), 0, 0);
}

/** Selects badge quotas. Empty fields match all. */
export class BadgeQuotaQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeQuota): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeQuota[]): BadgeQuota[] {
    const matched = collections.filter(items, (candidate: BadgeQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeQuotas(store: BadgeQuotaStore, query: BadgeQuotaQuery): BadgeQuota[] {
  return query.apply(store.list());
}
