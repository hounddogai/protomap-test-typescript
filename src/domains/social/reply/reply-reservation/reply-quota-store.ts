import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyQuota } from "./reply-quota.js";

/** Keeps reply quotas by code. */
export interface ReplyQuotaStore {
  find(code: string): ReplyQuota | undefined;
  save(item: ReplyQuota): void;
  remove(code: string): boolean;
  list(): ReplyQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyQuotaStore implements ReplyQuotaStore {
  items: Map<string, ReplyQuota>;
  order: string[];

  constructor(items: Map<string, ReplyQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyQuota): void {
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

  list(): ReplyQuota[] {
    const out: ReplyQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyQuotaStore(): ReplyQuotaStore {
  return new MemoryReplyQuotaStore(new Map<string, ReplyQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyQuotaStore implements ReplyQuotaStore {
  inner: ReplyQuotaStore;
  cache: cache.TtlCache<ReplyQuota>;
  hits: number;
  misses: number;

  constructor(inner: ReplyQuotaStore, cacheValue: cache.TtlCache<ReplyQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyQuota | undefined {
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

  save(item: ReplyQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyQuota[] {
    return this.inner.list();
  }
}

export function newCachedReplyQuotaStore(inner: ReplyQuotaStore, ttl: number, clockValue: clock.Clock): ReplyQuotaStore {
  return new CachedReplyQuotaStore(inner, cache.newTtlCache<ReplyQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects reply quotas. Empty fields match all. */
export class ReplyQuotaQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyQuota[]): ReplyQuota[] {
    const matched = collections.filter(items, (candidate: ReplyQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyQuotas(store: ReplyQuotaStore, query: ReplyQuotaQuery): ReplyQuota[] {
  return query.apply(store.list());
}
