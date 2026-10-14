import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedConversionAudit } from "./weighted-conversion-audit.js";

/** Keeps weighted conversion audits by code. */
export interface WeightedConversionAuditStore {
  find(code: string): WeightedConversionAudit | undefined;
  save(item: WeightedConversionAudit): void;
  remove(code: string): boolean;
  list(): WeightedConversionAudit[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedConversionAuditStore implements WeightedConversionAuditStore {
  items: Map<string, WeightedConversionAudit>;
  order: string[];

  constructor(items: Map<string, WeightedConversionAudit>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedConversionAudit | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedConversionAudit): void {
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

  list(): WeightedConversionAudit[] {
    const out: WeightedConversionAudit[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedConversionAuditStore(): WeightedConversionAuditStore {
  return new MemoryWeightedConversionAuditStore(new Map<string, WeightedConversionAudit>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedConversionAuditStore implements WeightedConversionAuditStore {
  inner: WeightedConversionAuditStore;
  cache: cache.TtlCache<WeightedConversionAudit>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedConversionAuditStore,
    cacheValue: cache.TtlCache<WeightedConversionAudit>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedConversionAudit | undefined {
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

  save(item: WeightedConversionAudit): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedConversionAudit[] {
    return this.inner.list();
  }
}

export function newCachedWeightedConversionAuditStore(inner: WeightedConversionAuditStore, ttl: number, clockValue: clock.Clock): WeightedConversionAuditStore {
  return new CachedWeightedConversionAuditStore(
    inner,
    cache.newTtlCache<WeightedConversionAudit>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted conversion audits. Empty fields match all. */
export class WeightedConversionAuditQuery {
  unit: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minPriority: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedConversionAudit): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedConversionAudit[]): WeightedConversionAudit[] {
    const matched = collections.filter(items, (candidate: WeightedConversionAudit): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedConversionAudits(store: WeightedConversionAuditStore, query: WeightedConversionAuditQuery): WeightedConversionAudit[] {
  return query.apply(store.list());
}
