import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

/** Keeps pending fraud check mappings by code. */
export interface PendingFraudCheckMappingStore {
  find(code: string): PendingFraudCheckMapping | undefined;
  save(item: PendingFraudCheckMapping): void;
  remove(code: string): boolean;
  list(): PendingFraudCheckMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFraudCheckMappingStore implements PendingFraudCheckMappingStore {
  items: Map<string, PendingFraudCheckMapping>;
  order: string[];

  constructor(items: Map<string, PendingFraudCheckMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFraudCheckMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFraudCheckMapping): void {
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

  list(): PendingFraudCheckMapping[] {
    const out: PendingFraudCheckMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFraudCheckMappingStore(): PendingFraudCheckMappingStore {
  return new MemoryPendingFraudCheckMappingStore(new Map<string, PendingFraudCheckMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFraudCheckMappingStore implements PendingFraudCheckMappingStore {
  inner: PendingFraudCheckMappingStore;
  cache: cache.TtlCache<PendingFraudCheckMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFraudCheckMappingStore,
    cacheValue: cache.TtlCache<PendingFraudCheckMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFraudCheckMapping | undefined {
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

  save(item: PendingFraudCheckMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFraudCheckMapping[] {
    return this.inner.list();
  }
}

export function newCachedPendingFraudCheckMappingStore(inner: PendingFraudCheckMappingStore, ttl: number, clockValue: clock.Clock): PendingFraudCheckMappingStore {
  return new CachedPendingFraudCheckMappingStore(
    inner,
    cache.newTtlCache<PendingFraudCheckMapping>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending fraud check mappings. Empty fields match all. */
export class PendingFraudCheckMappingQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFraudCheckMapping): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFraudCheckMapping[]): PendingFraudCheckMapping[] {
    const matched = collections.filter(items, (candidate: PendingFraudCheckMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFraudCheckMappings(store: PendingFraudCheckMappingStore, query: PendingFraudCheckMappingQuery): PendingFraudCheckMapping[] {
  return query.apply(store.list());
}
