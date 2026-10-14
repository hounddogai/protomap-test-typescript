import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentException } from "./enrollment-exception.js";

/** Keeps enrollment exceptions by code. */
export interface EnrollmentExceptionStore {
  find(code: string): EnrollmentException | undefined;
  save(item: EnrollmentException): void;
  remove(code: string): boolean;
  list(): EnrollmentException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentExceptionStore implements EnrollmentExceptionStore {
  items: Map<string, EnrollmentException>;
  order: string[];

  constructor(items: Map<string, EnrollmentException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentException): void {
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

  list(): EnrollmentException[] {
    const out: EnrollmentException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentExceptionStore(): EnrollmentExceptionStore {
  return new MemoryEnrollmentExceptionStore(new Map<string, EnrollmentException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentExceptionStore implements EnrollmentExceptionStore {
  inner: EnrollmentExceptionStore;
  cache: cache.TtlCache<EnrollmentException>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentExceptionStore,
    cacheValue: cache.TtlCache<EnrollmentException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentException | undefined {
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

  save(item: EnrollmentException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentException[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentExceptionStore(inner: EnrollmentExceptionStore, ttl: number, clockValue: clock.Clock): EnrollmentExceptionStore {
  return new CachedEnrollmentExceptionStore(inner, cache.newTtlCache<EnrollmentException>(256, ttl, clockValue), 0, 0);
}

/** Selects enrollment exceptions. Empty fields match all. */
export class EnrollmentExceptionQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentException): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentException[]): EnrollmentException[] {
    const matched = collections.filter(items, (candidate: EnrollmentException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentExceptions(store: EnrollmentExceptionStore, query: EnrollmentExceptionQuery): EnrollmentException[] {
  return query.apply(store.list());
}
