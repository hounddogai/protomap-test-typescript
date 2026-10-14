import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostQuota } from "./post-quota.js";

/** Keeps post quotas by code. */
export interface PostQuotaStore {
  find(code: string): PostQuota | undefined;
  save(item: PostQuota): void;
  remove(code: string): boolean;
  list(): PostQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostQuotaStore implements PostQuotaStore {
  items: Map<string, PostQuota>;
  order: string[];

  constructor(items: Map<string, PostQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostQuota): void {
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

  list(): PostQuota[] {
    const out: PostQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostQuotaStore(): PostQuotaStore {
  return new MemoryPostQuotaStore(new Map<string, PostQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostQuotaStore implements PostQuotaStore {
  inner: PostQuotaStore;
  cache: cache.TtlCache<PostQuota>;
  hits: number;
  misses: number;

  constructor(inner: PostQuotaStore, cacheValue: cache.TtlCache<PostQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostQuota | undefined {
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

  save(item: PostQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostQuota[] {
    return this.inner.list();
  }
}

export function newCachedPostQuotaStore(inner: PostQuotaStore, ttl: number, clockValue: clock.Clock): PostQuotaStore {
  return new CachedPostQuotaStore(inner, cache.newTtlCache<PostQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects post quotas. Empty fields match all. */
export class PostQuotaQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostQuota[]): PostQuota[] {
    const matched = collections.filter(items, (candidate: PostQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostQuotas(store: PostQuotaStore, query: PostQuotaQuery): PostQuota[] {
  return query.apply(store.list());
}
