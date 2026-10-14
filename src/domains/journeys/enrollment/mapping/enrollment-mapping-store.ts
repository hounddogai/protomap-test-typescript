import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentMapping } from "./enrollment-mapping.js";

/** Keeps enrollment mappings by code. */
export interface EnrollmentMappingStore {
  find(code: string): EnrollmentMapping | undefined;
  save(item: EnrollmentMapping): void;
  remove(code: string): boolean;
  list(): EnrollmentMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentMappingStore implements EnrollmentMappingStore {
  items: Map<string, EnrollmentMapping>;
  order: string[];

  constructor(items: Map<string, EnrollmentMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentMapping): void {
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

  list(): EnrollmentMapping[] {
    const out: EnrollmentMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentMappingStore(): EnrollmentMappingStore {
  return new MemoryEnrollmentMappingStore(new Map<string, EnrollmentMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentMappingStore implements EnrollmentMappingStore {
  inner: EnrollmentMappingStore;
  cache: cache.TtlCache<EnrollmentMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentMappingStore,
    cacheValue: cache.TtlCache<EnrollmentMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentMapping | undefined {
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

  save(item: EnrollmentMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentMapping[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentMappingStore(inner: EnrollmentMappingStore, ttl: number, clockValue: clock.Clock): EnrollmentMappingStore {
  return new CachedEnrollmentMappingStore(inner, cache.newTtlCache<EnrollmentMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects enrollment mappings. Empty fields match all. */
export class EnrollmentMappingQuery {
  title: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minStartsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentMapping): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentMapping[]): EnrollmentMapping[] {
    const matched = collections.filter(items, (candidate: EnrollmentMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentMappings(store: EnrollmentMappingStore, query: EnrollmentMappingQuery): EnrollmentMapping[] {
  return query.apply(store.list());
}
