import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalWindowAudit } from "./global-window-audit.js";

/** Keeps global window audits by code. */
export interface GlobalWindowAuditStore {
  find(code: string): GlobalWindowAudit | undefined;
  save(item: GlobalWindowAudit): void;
  remove(code: string): boolean;
  list(): GlobalWindowAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalWindowAuditStore implements GlobalWindowAuditStore {
  items: Map<string, GlobalWindowAudit>;
  order: string[];

  constructor(items: Map<string, GlobalWindowAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalWindowAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalWindowAudit): void {
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

  list(): GlobalWindowAudit[] {
    const out: GlobalWindowAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalWindowAuditStore(): GlobalWindowAuditStore {
  return new MemoryGlobalWindowAuditStore(new Map<string, GlobalWindowAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalWindowAuditStore implements GlobalWindowAuditStore {
  inner: GlobalWindowAuditStore;
  cache: cache.TtlCache<GlobalWindowAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalWindowAuditStore,
    cacheValue: cache.TtlCache<GlobalWindowAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalWindowAudit | undefined {
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

  save(item: GlobalWindowAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalWindowAudit[] {
    return this.inner.list();
  }
}

export function newCachedGlobalWindowAuditStore(inner: GlobalWindowAuditStore, ttl: number, clockValue: clock.Clock): GlobalWindowAuditStore {
  return new CachedGlobalWindowAuditStore(inner, cache.newTtlCache<GlobalWindowAudit>(1024, ttl, clockValue), 0, 0);
}

/** Selects global window audits. Empty fields match all. */
export class GlobalWindowAuditQuery {
  country: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minFloorValue: number, statuses: string[], limit: number) {
    this.country = country;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalWindowAudit): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalWindowAudit[]): GlobalWindowAudit[] {
    const matched = collections.filter(items, (candidate: GlobalWindowAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalWindowAudits(store: GlobalWindowAuditStore, query: GlobalWindowAuditQuery): GlobalWindowAudit[] {
  return query.apply(store.list());
}
