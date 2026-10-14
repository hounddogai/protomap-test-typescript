import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredInviteAudit } from "./tiered-invite-audit.js";

/** Keeps tiered invite audits by code. */
export interface TieredInviteAuditStore {
  find(code: string): TieredInviteAudit | undefined;
  save(item: TieredInviteAudit): void;
  remove(code: string): boolean;
  list(): TieredInviteAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredInviteAuditStore implements TieredInviteAuditStore {
  items: Map<string, TieredInviteAudit>;
  order: string[];

  constructor(items: Map<string, TieredInviteAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredInviteAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredInviteAudit): void {
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

  list(): TieredInviteAudit[] {
    const out: TieredInviteAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredInviteAuditStore(): TieredInviteAuditStore {
  return new MemoryTieredInviteAuditStore(new Map<string, TieredInviteAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredInviteAuditStore implements TieredInviteAuditStore {
  inner: TieredInviteAuditStore;
  cache: cache.TtlCache<TieredInviteAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredInviteAuditStore,
    cacheValue: cache.TtlCache<TieredInviteAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredInviteAudit | undefined {
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

  save(item: TieredInviteAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredInviteAudit[] {
    return this.inner.list();
  }
}

export function newCachedTieredInviteAuditStore(inner: TieredInviteAuditStore, ttl: number, clockValue: clock.Clock): TieredInviteAuditStore {
  return new CachedTieredInviteAuditStore(inner, cache.newTtlCache<TieredInviteAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered invite audits. Empty fields match all. */
export class TieredInviteAuditQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredInviteAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredInviteAudit[]): TieredInviteAudit[] {
    const matched = collections.filter(items, (candidate: TieredInviteAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredInviteAudits(store: TieredInviteAuditStore, query: TieredInviteAuditQuery): TieredInviteAudit[] {
  return query.apply(store.list());
}
