import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowAudit } from "./window-audit.js";

/** Keeps window audits by code. */
export interface WindowAuditStore {
  find(code: string): WindowAudit | undefined;
  save(item: WindowAudit): void;
  remove(code: string): boolean;
  list(): WindowAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowAuditStore implements WindowAuditStore {
  items: Map<string, WindowAudit>;
  order: string[];

  constructor(items: Map<string, WindowAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowAudit): void {
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

  list(): WindowAudit[] {
    const out: WindowAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowAuditStore(): WindowAuditStore {
  return new MemoryWindowAuditStore(new Map<string, WindowAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowAuditStore implements WindowAuditStore {
  inner: WindowAuditStore;
  cache: cache.TtlCache<WindowAudit>;
  hits: number;
  misses: number;

  constructor(inner: WindowAuditStore, cacheValue: cache.TtlCache<WindowAudit>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowAudit | undefined {
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

  save(item: WindowAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowAudit[] {
    return this.inner.list();
  }
}

export function newCachedWindowAuditStore(inner: WindowAuditStore, ttl: number, clockValue: clock.Clock): WindowAuditStore {
  return new CachedWindowAuditStore(inner, cache.newTtlCache<WindowAudit>(256, ttl, clockValue), 0, 0);
}

/** Selects window audits. Empty fields match all. */
export class WindowAuditQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowAudit): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowAudit[]): WindowAudit[] {
    const matched = collections.filter(items, (candidate: WindowAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowAudits(store: WindowAuditStore, query: WindowAuditQuery): WindowAudit[] {
  return query.apply(store.list());
}
