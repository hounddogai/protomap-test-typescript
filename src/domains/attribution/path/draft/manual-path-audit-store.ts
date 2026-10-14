import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPathAudit } from "./manual-path-audit.js";

/** Keeps manual path audits by code. */
export interface ManualPathAuditStore {
  find(code: string): ManualPathAudit | undefined;
  save(item: ManualPathAudit): void;
  remove(code: string): boolean;
  list(): ManualPathAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPathAuditStore implements ManualPathAuditStore {
  items: Map<string, ManualPathAudit>;
  order: string[];

  constructor(items: Map<string, ManualPathAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPathAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPathAudit): void {
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

  list(): ManualPathAudit[] {
    const out: ManualPathAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPathAuditStore(): ManualPathAuditStore {
  return new MemoryManualPathAuditStore(new Map<string, ManualPathAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPathAuditStore implements ManualPathAuditStore {
  inner: ManualPathAuditStore;
  cache: cache.TtlCache<ManualPathAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPathAuditStore,
    cacheValue: cache.TtlCache<ManualPathAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPathAudit | undefined {
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

  save(item: ManualPathAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPathAudit[] {
    return this.inner.list();
  }
}

export function newCachedManualPathAuditStore(inner: ManualPathAuditStore, ttl: number, clockValue: clock.Clock): ManualPathAuditStore {
  return new CachedManualPathAuditStore(inner, cache.newTtlCache<ManualPathAudit>(512, ttl, clockValue), 0, 0);
}

/** Selects manual path audits. Empty fields match all. */
export class ManualPathAuditQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPathAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPathAudit[]): ManualPathAudit[] {
    const matched = collections.filter(items, (candidate: ManualPathAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPathAudits(store: ManualPathAuditStore, query: ManualPathAuditQuery): ManualPathAudit[] {
  return query.apply(store.list());
}
