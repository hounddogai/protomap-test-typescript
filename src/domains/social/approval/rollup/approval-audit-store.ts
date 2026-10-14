import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ApprovalAudit } from "./approval-audit.js";

/** Keeps approval audits by code. */
export interface ApprovalAuditStore {
  find(code: string): ApprovalAudit | undefined;
  save(item: ApprovalAudit): void;
  remove(code: string): boolean;
  list(): ApprovalAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryApprovalAuditStore implements ApprovalAuditStore {
  items: Map<string, ApprovalAudit>;
  order: string[];

  constructor(items: Map<string, ApprovalAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ApprovalAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ApprovalAudit): void {
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

  list(): ApprovalAudit[] {
    const out: ApprovalAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryApprovalAuditStore(): ApprovalAuditStore {
  return new MemoryApprovalAuditStore(new Map<string, ApprovalAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedApprovalAuditStore implements ApprovalAuditStore {
  inner: ApprovalAuditStore;
  cache: cache.TtlCache<ApprovalAudit>;
  hits: number;
  misses: number;

  constructor(inner: ApprovalAuditStore, cacheValue: cache.TtlCache<ApprovalAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ApprovalAudit | undefined {
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

  save(item: ApprovalAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ApprovalAudit[] {
    return this.inner.list();
  }
}

export function newCachedApprovalAuditStore(inner: ApprovalAuditStore, ttl: number, clockValue: clock.Clock): ApprovalAuditStore {
  return new CachedApprovalAuditStore(inner, cache.newTtlCache<ApprovalAudit>(64, ttl, clockValue), 0, 0);
}

/** Selects approval audits. Empty fields match all. */
export class ApprovalAuditQuery {
  name: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ApprovalAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ApprovalAudit[]): ApprovalAudit[] {
    const matched = collections.filter(items, (candidate: ApprovalAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findApprovalAudits(store: ApprovalAuditStore, query: ApprovalAuditQuery): ApprovalAudit[] {
  return query.apply(store.list());
}
