import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPlacementAudit } from "./legacy-placement-audit.js";

/** Keeps legacy placement audits by code. */
export interface LegacyPlacementAuditStore {
  find(code: string): LegacyPlacementAudit | undefined;
  save(item: LegacyPlacementAudit): void;
  remove(code: string): boolean;
  list(): LegacyPlacementAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPlacementAuditStore implements LegacyPlacementAuditStore {
  items: Map<string, LegacyPlacementAudit>;
  order: string[];

  constructor(items: Map<string, LegacyPlacementAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPlacementAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPlacementAudit): void {
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

  list(): LegacyPlacementAudit[] {
    const out: LegacyPlacementAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPlacementAuditStore(): LegacyPlacementAuditStore {
  return new MemoryLegacyPlacementAuditStore(new Map<string, LegacyPlacementAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPlacementAuditStore implements LegacyPlacementAuditStore {
  inner: LegacyPlacementAuditStore;
  cache: cache.TtlCache<LegacyPlacementAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPlacementAuditStore,
    cacheValue: cache.TtlCache<LegacyPlacementAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPlacementAudit | undefined {
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

  save(item: LegacyPlacementAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPlacementAudit[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPlacementAuditStore(inner: LegacyPlacementAuditStore, ttl: number, clockValue: clock.Clock): LegacyPlacementAuditStore {
  return new CachedLegacyPlacementAuditStore(
    inner,
    cache.newTtlCache<LegacyPlacementAudit>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy placement audits. Empty fields match all. */
export class LegacyPlacementAuditQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPlacementAudit): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPlacementAudit[]): LegacyPlacementAudit[] {
    const matched = collections.filter(items, (candidate: LegacyPlacementAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPlacementAudits(store: LegacyPlacementAuditStore, query: LegacyPlacementAuditQuery): LegacyPlacementAudit[] {
  return query.apply(store.list());
}
