import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionAudit } from "./redemption-audit.js";

/** Keeps redemption audits by code. */
export interface RedemptionAuditStore {
  find(code: string): RedemptionAudit | undefined;
  save(item: RedemptionAudit): void;
  remove(code: string): boolean;
  list(): RedemptionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionAuditStore implements RedemptionAuditStore {
  items: Map<string, RedemptionAudit>;
  order: string[];

  constructor(items: Map<string, RedemptionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionAudit): void {
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

  list(): RedemptionAudit[] {
    const out: RedemptionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionAuditStore(): RedemptionAuditStore {
  return new MemoryRedemptionAuditStore(new Map<string, RedemptionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionAuditStore implements RedemptionAuditStore {
  inner: RedemptionAuditStore;
  cache: cache.TtlCache<RedemptionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionAuditStore,
    cacheValue: cache.TtlCache<RedemptionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionAudit | undefined {
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

  save(item: RedemptionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionAudit[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionAuditStore(inner: RedemptionAuditStore, ttl: number, clockValue: clock.Clock): RedemptionAuditStore {
  return new CachedRedemptionAuditStore(inner, cache.newTtlCache<RedemptionAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects redemption audits. Empty fields match all. */
export class RedemptionAuditQuery {
  locale: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCapacity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionAudit): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionAudit[]): RedemptionAudit[] {
    const matched = collections.filter(items, (candidate: RedemptionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionAudits(store: RedemptionAuditStore, query: RedemptionAuditQuery): RedemptionAudit[] {
  return query.apply(store.list());
}
