import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalEnrollmentMapping } from "./regional-enrollment-mapping.js";

/** Keeps regional enrollment mappings by code. */
export interface RegionalEnrollmentMappingStore {
  find(code: string): RegionalEnrollmentMapping | undefined;
  save(item: RegionalEnrollmentMapping): void;
  remove(code: string): boolean;
  list(): RegionalEnrollmentMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalEnrollmentMappingStore implements RegionalEnrollmentMappingStore {
  items: Map<string, RegionalEnrollmentMapping>;
  order: string[];

  constructor(items: Map<string, RegionalEnrollmentMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalEnrollmentMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalEnrollmentMapping): void {
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

  list(): RegionalEnrollmentMapping[] {
    const out: RegionalEnrollmentMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalEnrollmentMappingStore(): RegionalEnrollmentMappingStore {
  return new MemoryRegionalEnrollmentMappingStore(new Map<string, RegionalEnrollmentMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalEnrollmentMappingStore implements RegionalEnrollmentMappingStore {
  inner: RegionalEnrollmentMappingStore;
  cache: cache.TtlCache<RegionalEnrollmentMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalEnrollmentMappingStore,
    cacheValue: cache.TtlCache<RegionalEnrollmentMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalEnrollmentMapping | undefined {
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

  save(item: RegionalEnrollmentMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalEnrollmentMapping[] {
    return this.inner.list();
  }
}

export function newCachedRegionalEnrollmentMappingStore(inner: RegionalEnrollmentMappingStore, ttl: number, clockValue: clock.Clock): RegionalEnrollmentMappingStore {
  return new CachedRegionalEnrollmentMappingStore(
    inner,
    cache.newTtlCache<RegionalEnrollmentMapping>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional enrollment mappings. Empty fields match all. */
export class RegionalEnrollmentMappingQuery {
  source: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWeight: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalEnrollmentMapping): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalEnrollmentMapping[]): RegionalEnrollmentMapping[] {
    const matched = collections.filter(items, (candidate: RegionalEnrollmentMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalEnrollmentMappings(store: RegionalEnrollmentMappingStore, query: RegionalEnrollmentMappingQuery): RegionalEnrollmentMapping[] {
  return query.apply(store.list());
}
