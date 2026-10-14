import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeAudit } from "./badge-audit.js";

/** Keeps badge audits by code. */
export interface BadgeAuditStore {
  find(code: string): BadgeAudit | undefined;
  save(item: BadgeAudit): void;
  remove(code: string): boolean;
  list(): BadgeAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeAuditStore implements BadgeAuditStore {
  items: Map<string, BadgeAudit>;
  order: string[];

  constructor(items: Map<string, BadgeAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeAudit): void {
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

  list(): BadgeAudit[] {
    const out: BadgeAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeAuditStore(): BadgeAuditStore {
  return new MemoryBadgeAuditStore(new Map<string, BadgeAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeAuditStore implements BadgeAuditStore {
  inner: BadgeAuditStore;
  cache: cache.TtlCache<BadgeAudit>;
  hits: number;
  misses: number;

  constructor(inner: BadgeAuditStore, cacheValue: cache.TtlCache<BadgeAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeAudit | undefined {
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

  save(item: BadgeAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeAudit[] {
    return this.inner.list();
  }
}

export function newCachedBadgeAuditStore(inner: BadgeAuditStore, ttl: number, clockValue: clock.Clock): BadgeAuditStore {
  return new CachedBadgeAuditStore(inner, cache.newTtlCache<BadgeAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects badge audits. Empty fields match all. */
export class BadgeAuditQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeAudit[]): BadgeAudit[] {
    const matched = collections.filter(items, (candidate: BadgeAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeAudits(store: BadgeAuditStore, query: BadgeAuditQuery): BadgeAudit[] {
  return query.apply(store.list());
}
