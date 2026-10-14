import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteQuota } from "./invite-quota.js";

/** Keeps invite quotas by code. */
export interface InviteQuotaStore {
  find(code: string): InviteQuota | undefined;
  save(item: InviteQuota): void;
  remove(code: string): boolean;
  list(): InviteQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteQuotaStore implements InviteQuotaStore {
  items: Map<string, InviteQuota>;
  order: string[];

  constructor(items: Map<string, InviteQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteQuota): void {
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

  list(): InviteQuota[] {
    const out: InviteQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteQuotaStore(): InviteQuotaStore {
  return new MemoryInviteQuotaStore(new Map<string, InviteQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteQuotaStore implements InviteQuotaStore {
  inner: InviteQuotaStore;
  cache: cache.TtlCache<InviteQuota>;
  hits: number;
  misses: number;

  constructor(inner: InviteQuotaStore, cacheValue: cache.TtlCache<InviteQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteQuota | undefined {
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

  save(item: InviteQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteQuota[] {
    return this.inner.list();
  }
}

export function newCachedInviteQuotaStore(inner: InviteQuotaStore, ttl: number, clockValue: clock.Clock): InviteQuotaStore {
  return new CachedInviteQuotaStore(inner, cache.newTtlCache<InviteQuota>(256, ttl, clockValue), 0, 0);
}

/** Selects invite quotas. Empty fields match all. */
export class InviteQuotaQuery {
  title: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFloorValue: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteQuota): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteQuota[]): InviteQuota[] {
    const matched = collections.filter(items, (candidate: InviteQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteQuotas(store: InviteQuotaStore, query: InviteQuotaQuery): InviteQuota[] {
  return query.apply(store.list());
}
