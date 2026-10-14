import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingComplaintMapping } from "./pending-complaint-mapping.js";

/** Keeps pending complaint mappings by code. */
export interface PendingComplaintMappingStore {
  find(code: string): PendingComplaintMapping | undefined;
  save(item: PendingComplaintMapping): void;
  remove(code: string): boolean;
  list(): PendingComplaintMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingComplaintMappingStore implements PendingComplaintMappingStore {
  items: Map<string, PendingComplaintMapping>;
  order: string[];

  constructor(items: Map<string, PendingComplaintMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingComplaintMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingComplaintMapping): void {
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

  list(): PendingComplaintMapping[] {
    const out: PendingComplaintMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingComplaintMappingStore(): PendingComplaintMappingStore {
  return new MemoryPendingComplaintMappingStore(new Map<string, PendingComplaintMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingComplaintMappingStore implements PendingComplaintMappingStore {
  inner: PendingComplaintMappingStore;
  cache: cache.TtlCache<PendingComplaintMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingComplaintMappingStore,
    cacheValue: cache.TtlCache<PendingComplaintMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingComplaintMapping | undefined {
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

  save(item: PendingComplaintMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingComplaintMapping[] {
    return this.inner.list();
  }
}

export function newCachedPendingComplaintMappingStore(inner: PendingComplaintMappingStore, ttl: number, clockValue: clock.Clock): PendingComplaintMappingStore {
  return new CachedPendingComplaintMappingStore(
    inner,
    cache.newTtlCache<PendingComplaintMapping>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending complaint mappings. Empty fields match all. */
export class PendingComplaintMappingQuery {
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

  matches(item: PendingComplaintMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingComplaintMapping[]): PendingComplaintMapping[] {
    const matched = collections.filter(items, (candidate: PendingComplaintMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingComplaintMappings(store: PendingComplaintMappingStore, query: PendingComplaintMappingQuery): PendingComplaintMapping[] {
  return query.apply(store.list());
}
