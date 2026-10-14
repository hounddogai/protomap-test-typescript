import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainMapping } from "./domain-mapping.js";

/** Keeps domain mappings by code. */
export interface DomainMappingStore {
  find(code: string): DomainMapping | undefined;
  save(item: DomainMapping): void;
  remove(code: string): boolean;
  list(): DomainMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainMappingStore implements DomainMappingStore {
  items: Map<string, DomainMapping>;
  order: string[];

  constructor(items: Map<string, DomainMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainMapping): void {
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

  list(): DomainMapping[] {
    const out: DomainMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainMappingStore(): DomainMappingStore {
  return new MemoryDomainMappingStore(new Map<string, DomainMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainMappingStore implements DomainMappingStore {
  inner: DomainMappingStore;
  cache: cache.TtlCache<DomainMapping>;
  hits: number;
  misses: number;

  constructor(inner: DomainMappingStore, cacheValue: cache.TtlCache<DomainMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainMapping | undefined {
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

  save(item: DomainMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainMapping[] {
    return this.inner.list();
  }
}

export function newCachedDomainMappingStore(inner: DomainMappingStore, ttl: number, clockValue: clock.Clock): DomainMappingStore {
  return new CachedDomainMappingStore(inner, cache.newTtlCache<DomainMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects domain mappings. Empty fields match all. */
export class DomainMappingQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainMapping): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainMapping[]): DomainMapping[] {
    const matched = collections.filter(items, (candidate: DomainMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainMappings(store: DomainMappingStore, query: DomainMappingQuery): DomainMapping[] {
  return query.apply(store.list());
}
