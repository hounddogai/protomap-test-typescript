import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueAudit } from "./queue-audit.js";

/** Keeps queue audits by code. */
export interface QueueAuditStore {
  find(code: string): QueueAudit | undefined;
  save(item: QueueAudit): void;
  remove(code: string): boolean;
  list(): QueueAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueAuditStore implements QueueAuditStore {
  items: Map<string, QueueAudit>;
  order: string[];

  constructor(items: Map<string, QueueAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueAudit): void {
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

  list(): QueueAudit[] {
    const out: QueueAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueAuditStore(): QueueAuditStore {
  return new MemoryQueueAuditStore(new Map<string, QueueAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueAuditStore implements QueueAuditStore {
  inner: QueueAuditStore;
  cache: cache.TtlCache<QueueAudit>;
  hits: number;
  misses: number;

  constructor(inner: QueueAuditStore, cacheValue: cache.TtlCache<QueueAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueAudit | undefined {
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

  save(item: QueueAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueAudit[] {
    return this.inner.list();
  }
}

export function newCachedQueueAuditStore(inner: QueueAuditStore, ttl: number, clockValue: clock.Clock): QueueAuditStore {
  return new CachedQueueAuditStore(inner, cache.newTtlCache<QueueAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue audits. Empty fields match all. */
export class QueueAuditQuery {
  region: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minAmount: number, statuses: string[], limit: number) {
    this.region = region;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueAudit): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueAudit[]): QueueAudit[] {
    const matched = collections.filter(items, (candidate: QueueAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueAudits(store: QueueAuditStore, query: QueueAuditQuery): QueueAudit[] {
  return query.apply(store.list());
}
