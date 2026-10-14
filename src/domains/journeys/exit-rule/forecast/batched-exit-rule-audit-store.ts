import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedExitRuleAudit } from "./batched-exit-rule-audit.js";

/** Keeps batched exit rule audits by code. */
export interface BatchedExitRuleAuditStore {
  find(code: string): BatchedExitRuleAudit | undefined;
  save(item: BatchedExitRuleAudit): void;
  remove(code: string): boolean;
  list(): BatchedExitRuleAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedExitRuleAuditStore implements BatchedExitRuleAuditStore {
  items: Map<string, BatchedExitRuleAudit>;
  order: string[];

  constructor(items: Map<string, BatchedExitRuleAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedExitRuleAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedExitRuleAudit): void {
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

  list(): BatchedExitRuleAudit[] {
    const out: BatchedExitRuleAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedExitRuleAuditStore(): BatchedExitRuleAuditStore {
  return new MemoryBatchedExitRuleAuditStore(new Map<string, BatchedExitRuleAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedExitRuleAuditStore implements BatchedExitRuleAuditStore {
  inner: BatchedExitRuleAuditStore;
  cache: cache.TtlCache<BatchedExitRuleAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedExitRuleAuditStore,
    cacheValue: cache.TtlCache<BatchedExitRuleAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedExitRuleAudit | undefined {
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

  save(item: BatchedExitRuleAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedExitRuleAudit[] {
    return this.inner.list();
  }
}

export function newCachedBatchedExitRuleAuditStore(inner: BatchedExitRuleAuditStore, ttl: number, clockValue: clock.Clock): BatchedExitRuleAuditStore {
  return new CachedBatchedExitRuleAuditStore(
    inner,
    cache.newTtlCache<BatchedExitRuleAudit>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched exit rule audits. Empty fields match all. */
export class BatchedExitRuleAuditQuery {
  title: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedExitRuleAudit): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedExitRuleAudit[]): BatchedExitRuleAudit[] {
    const matched = collections.filter(items, (candidate: BatchedExitRuleAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedExitRuleAudits(store: BatchedExitRuleAuditStore, query: BatchedExitRuleAuditQuery): BatchedExitRuleAudit[] {
  return query.apply(store.list());
}
