import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWindowQuota } from "./rolling-window-quota.js";

/** Keeps rolling window quotas by code. */
export interface RollingWindowQuotaStore {
  find(code: string): RollingWindowQuota | undefined;
  save(item: RollingWindowQuota): void;
  remove(code: string): boolean;
  list(): RollingWindowQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWindowQuotaStore implements RollingWindowQuotaStore {
  items: Map<string, RollingWindowQuota>;
  order: string[];

  constructor(items: Map<string, RollingWindowQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWindowQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWindowQuota): void {
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

  list(): RollingWindowQuota[] {
    const out: RollingWindowQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWindowQuotaStore(): RollingWindowQuotaStore {
  return new MemoryRollingWindowQuotaStore(new Map<string, RollingWindowQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWindowQuotaStore implements RollingWindowQuotaStore {
  inner: RollingWindowQuotaStore;
  cache: cache.TtlCache<RollingWindowQuota>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWindowQuotaStore,
    cacheValue: cache.TtlCache<RollingWindowQuota>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWindowQuota | undefined {
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

  save(item: RollingWindowQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWindowQuota[] {
    return this.inner.list();
  }
}

export function newCachedRollingWindowQuotaStore(inner: RollingWindowQuotaStore, ttl: number, clockValue: clock.Clock): RollingWindowQuotaStore {
  return new CachedRollingWindowQuotaStore(inner, cache.newTtlCache<RollingWindowQuota>(1024, ttl, clockValue), 0, 0);
}

/** Selects rolling window quotas. Empty fields match all. */
export class RollingWindowQuotaQuery {
  channel: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minSendAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWindowQuota): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWindowQuota[]): RollingWindowQuota[] {
    const matched = collections.filter(items, (candidate: RollingWindowQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWindowQuotas(store: RollingWindowQuotaStore, query: RollingWindowQuotaQuery): RollingWindowQuota[] {
  return query.apply(store.list());
}
