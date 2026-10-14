import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitAudit } from "./wait-audit.js";

/** Keeps wait audits by code. */
export interface WaitAuditStore {
  find(code: string): WaitAudit | undefined;
  save(item: WaitAudit): void;
  remove(code: string): boolean;
  list(): WaitAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitAuditStore implements WaitAuditStore {
  items: Map<string, WaitAudit>;
  order: string[];

  constructor(items: Map<string, WaitAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitAudit): void {
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

  list(): WaitAudit[] {
    const out: WaitAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitAuditStore(): WaitAuditStore {
  return new MemoryWaitAuditStore(new Map<string, WaitAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitAuditStore implements WaitAuditStore {
  inner: WaitAuditStore;
  cache: cache.TtlCache<WaitAudit>;
  hits: number;
  misses: number;

  constructor(inner: WaitAuditStore, cacheValue: cache.TtlCache<WaitAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitAudit | undefined {
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

  save(item: WaitAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitAudit[] {
    return this.inner.list();
  }
}

export function newCachedWaitAuditStore(inner: WaitAuditStore, ttl: number, clockValue: clock.Clock): WaitAuditStore {
  return new CachedWaitAuditStore(inner, cache.newTtlCache<WaitAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects wait audits. Empty fields match all. */
export class WaitAuditQuery {
  name: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minQuantity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitAudit): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitAudit[]): WaitAudit[] {
    const matched = collections.filter(items, (candidate: WaitAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitAudits(store: WaitAuditStore, query: WaitAuditQuery): WaitAudit[] {
  return query.apply(store.list());
}
