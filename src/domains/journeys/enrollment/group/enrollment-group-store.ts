import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentGroup } from "./enrollment-group.js";

/** Keeps enrollment groups by code. */
export interface EnrollmentGroupStore {
  find(code: string): EnrollmentGroup | undefined;
  save(item: EnrollmentGroup): void;
  remove(code: string): boolean;
  list(): EnrollmentGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentGroupStore implements EnrollmentGroupStore {
  items: Map<string, EnrollmentGroup>;
  order: string[];

  constructor(items: Map<string, EnrollmentGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentGroup): void {
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

  list(): EnrollmentGroup[] {
    const out: EnrollmentGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentGroupStore(): EnrollmentGroupStore {
  return new MemoryEnrollmentGroupStore(new Map<string, EnrollmentGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentGroupStore implements EnrollmentGroupStore {
  inner: EnrollmentGroupStore;
  cache: cache.TtlCache<EnrollmentGroup>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentGroupStore,
    cacheValue: cache.TtlCache<EnrollmentGroup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentGroup | undefined {
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

  save(item: EnrollmentGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentGroup[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentGroupStore(inner: EnrollmentGroupStore, ttl: number, clockValue: clock.Clock): EnrollmentGroupStore {
  return new CachedEnrollmentGroupStore(inner, cache.newTtlCache<EnrollmentGroup>(512, ttl, clockValue), 0, 0);
}

/** Selects enrollment groups. Empty fields match all. */
export class EnrollmentGroupQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentGroup): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentGroup[]): EnrollmentGroup[] {
    const matched = collections.filter(items, (candidate: EnrollmentGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentGroups(store: EnrollmentGroupStore, query: EnrollmentGroupQuery): EnrollmentGroup[] {
  return query.apply(store.list());
}
