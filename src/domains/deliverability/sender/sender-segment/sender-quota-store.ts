import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderQuota } from "./sender-quota.js";

/** Keeps sender quotas by code. */
export interface SenderQuotaStore {
  find(code: string): SenderQuota | undefined;
  save(item: SenderQuota): void;
  remove(code: string): boolean;
  list(): SenderQuota[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderQuotaStore implements SenderQuotaStore {
  items: Map<string, SenderQuota>;
  order: string[];

  constructor(items: Map<string, SenderQuota>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderQuota | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderQuota): void {
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

  list(): SenderQuota[] {
    const out: SenderQuota[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderQuotaStore(): SenderQuotaStore {
  return new MemorySenderQuotaStore(new Map<string, SenderQuota>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderQuotaStore implements SenderQuotaStore {
  inner: SenderQuotaStore;
  cache: cache.TtlCache<SenderQuota>;
  hits: number;
  misses: number;

  constructor(inner: SenderQuotaStore, cacheValue: cache.TtlCache<SenderQuota>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderQuota | undefined {
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

  save(item: SenderQuota): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderQuota[] {
    return this.inner.list();
  }
}

export function newCachedSenderQuotaStore(inner: SenderQuotaStore, ttl: number, clockValue: clock.Clock): SenderQuotaStore {
  return new CachedSenderQuotaStore(inner, cache.newTtlCache<SenderQuota>(64, ttl, clockValue), 0, 0);
}

/** Selects sender quotas. Empty fields match all. */
export class SenderQuotaQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderQuota): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderQuota[]): SenderQuota[] {
    const matched = collections.filter(items, (candidate: SenderQuota): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderQuotas(store: SenderQuotaStore, query: SenderQuotaQuery): SenderQuota[] {
  return query.apply(store.list());
}
