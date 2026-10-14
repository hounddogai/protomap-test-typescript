import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalApprovalAudit } from "./global-approval-audit.js";

/** Keeps global approval audits by code. */
export interface GlobalApprovalAuditStore {
  find(code: string): GlobalApprovalAudit | undefined;
  save(item: GlobalApprovalAudit): void;
  remove(code: string): boolean;
  list(): GlobalApprovalAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalApprovalAuditStore implements GlobalApprovalAuditStore {
  items: Map<string, GlobalApprovalAudit>;
  order: string[];

  constructor(items: Map<string, GlobalApprovalAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalApprovalAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalApprovalAudit): void {
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

  list(): GlobalApprovalAudit[] {
    const out: GlobalApprovalAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalApprovalAuditStore(): GlobalApprovalAuditStore {
  return new MemoryGlobalApprovalAuditStore(new Map<string, GlobalApprovalAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalApprovalAuditStore implements GlobalApprovalAuditStore {
  inner: GlobalApprovalAuditStore;
  cache: cache.TtlCache<GlobalApprovalAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalApprovalAuditStore,
    cacheValue: cache.TtlCache<GlobalApprovalAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalApprovalAudit | undefined {
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

  save(item: GlobalApprovalAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalApprovalAudit[] {
    return this.inner.list();
  }
}

export function newCachedGlobalApprovalAuditStore(inner: GlobalApprovalAuditStore, ttl: number, clockValue: clock.Clock): GlobalApprovalAuditStore {
  return new CachedGlobalApprovalAuditStore(inner, cache.newTtlCache<GlobalApprovalAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects global approval audits. Empty fields match all. */
export class GlobalApprovalAuditQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalApprovalAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalApprovalAudit[]): GlobalApprovalAudit[] {
    const matched = collections.filter(items, (candidate: GlobalApprovalAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalApprovalAudits(store: GlobalApprovalAuditStore, query: GlobalApprovalAuditQuery): GlobalApprovalAudit[] {
  return query.apply(store.list());
}
