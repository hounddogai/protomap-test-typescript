import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingApprovalAudit } from "./pending-approval-audit.js";

/** Keeps pending approval audits by code. */
export interface PendingApprovalAuditStore {
  find(code: string): PendingApprovalAudit | undefined;
  save(item: PendingApprovalAudit): void;
  remove(code: string): boolean;
  list(): PendingApprovalAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingApprovalAuditStore implements PendingApprovalAuditStore {
  items: Map<string, PendingApprovalAudit>;
  order: string[];

  constructor(items: Map<string, PendingApprovalAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingApprovalAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingApprovalAudit): void {
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

  list(): PendingApprovalAudit[] {
    const out: PendingApprovalAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingApprovalAuditStore(): PendingApprovalAuditStore {
  return new MemoryPendingApprovalAuditStore(new Map<string, PendingApprovalAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingApprovalAuditStore implements PendingApprovalAuditStore {
  inner: PendingApprovalAuditStore;
  cache: cache.TtlCache<PendingApprovalAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingApprovalAuditStore,
    cacheValue: cache.TtlCache<PendingApprovalAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingApprovalAudit | undefined {
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

  save(item: PendingApprovalAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingApprovalAudit[] {
    return this.inner.list();
  }
}

export function newCachedPendingApprovalAuditStore(inner: PendingApprovalAuditStore, ttl: number, clockValue: clock.Clock): PendingApprovalAuditStore {
  return new CachedPendingApprovalAuditStore(
    inner,
    cache.newTtlCache<PendingApprovalAudit>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending approval audits. Empty fields match all. */
export class PendingApprovalAuditQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingApprovalAudit): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingApprovalAudit[]): PendingApprovalAudit[] {
    const matched = collections.filter(items, (candidate: PendingApprovalAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingApprovalAudits(store: PendingApprovalAuditStore, query: PendingApprovalAuditQuery): PendingApprovalAudit[] {
  return query.apply(store.list());
}
