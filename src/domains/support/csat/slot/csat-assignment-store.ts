import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatAssignment } from "./csat-assignment.js";

/** Keeps csat assignments by code. */
export interface CsatAssignmentStore {
  find(code: string): CsatAssignment | undefined;
  save(item: CsatAssignment): void;
  remove(code: string): boolean;
  list(): CsatAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatAssignmentStore implements CsatAssignmentStore {
  items: Map<string, CsatAssignment>;
  order: string[];

  constructor(items: Map<string, CsatAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatAssignment): void {
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

  list(): CsatAssignment[] {
    const out: CsatAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatAssignmentStore(): CsatAssignmentStore {
  return new MemoryCsatAssignmentStore(new Map<string, CsatAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatAssignmentStore implements CsatAssignmentStore {
  inner: CsatAssignmentStore;
  cache: cache.TtlCache<CsatAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: CsatAssignmentStore,
    cacheValue: cache.TtlCache<CsatAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatAssignment | undefined {
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

  save(item: CsatAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatAssignment[] {
    return this.inner.list();
  }
}

export function newCachedCsatAssignmentStore(inner: CsatAssignmentStore, ttl: number, clockValue: clock.Clock): CsatAssignmentStore {
  return new CachedCsatAssignmentStore(inner, cache.newTtlCache<CsatAssignment>(256, ttl, clockValue), 0, 0);
}

/** Selects csat assignments. Empty fields match all. */
export class CsatAssignmentQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatAssignment): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatAssignment[]): CsatAssignment[] {
    const matched = collections.filter(items, (candidate: CsatAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatAssignments(store: CsatAssignmentStore, query: CsatAssignmentQuery): CsatAssignment[] {
  return query.apply(store.list());
}
