import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintMapping } from "./complaint-mapping.js";

/** Keeps complaint mappings by code. */
export interface ComplaintMappingStore {
  find(code: string): ComplaintMapping | undefined;
  save(item: ComplaintMapping): void;
  remove(code: string): boolean;
  list(): ComplaintMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintMappingStore implements ComplaintMappingStore {
  items: Map<string, ComplaintMapping>;
  order: string[];

  constructor(items: Map<string, ComplaintMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintMapping): void {
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

  list(): ComplaintMapping[] {
    const out: ComplaintMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintMappingStore(): ComplaintMappingStore {
  return new MemoryComplaintMappingStore(new Map<string, ComplaintMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintMappingStore implements ComplaintMappingStore {
  inner: ComplaintMappingStore;
  cache: cache.TtlCache<ComplaintMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintMappingStore,
    cacheValue: cache.TtlCache<ComplaintMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintMapping | undefined {
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

  save(item: ComplaintMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintMapping[] {
    return this.inner.list();
  }
}

export function newCachedComplaintMappingStore(inner: ComplaintMappingStore, ttl: number, clockValue: clock.Clock): ComplaintMappingStore {
  return new CachedComplaintMappingStore(inner, cache.newTtlCache<ComplaintMapping>(1024, ttl, clockValue), 0, 0);
}

/** Selects complaint mappings. Empty fields match all. */
export class ComplaintMappingQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintMapping[]): ComplaintMapping[] {
    const matched = collections.filter(items, (candidate: ComplaintMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintMappings(store: ComplaintMappingStore, query: ComplaintMappingQuery): ComplaintMapping[] {
  return query.apply(store.list());
}
