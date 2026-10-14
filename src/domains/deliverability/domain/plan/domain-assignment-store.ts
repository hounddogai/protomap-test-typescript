import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainAssignment } from "./domain-assignment.js";

/** Keeps domain assignments by code. */
export interface DomainAssignmentStore {
  find(code: string): DomainAssignment | undefined;
  save(item: DomainAssignment): void;
  remove(code: string): boolean;
  list(): DomainAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainAssignmentStore implements DomainAssignmentStore {
  items: Map<string, DomainAssignment>;
  order: string[];

  constructor(items: Map<string, DomainAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainAssignment): void {
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

  list(): DomainAssignment[] {
    const out: DomainAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainAssignmentStore(): DomainAssignmentStore {
  return new MemoryDomainAssignmentStore(new Map<string, DomainAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainAssignmentStore implements DomainAssignmentStore {
  inner: DomainAssignmentStore;
  cache: cache.TtlCache<DomainAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: DomainAssignmentStore,
    cacheValue: cache.TtlCache<DomainAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainAssignment | undefined {
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

  save(item: DomainAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainAssignment[] {
    return this.inner.list();
  }
}

export function newCachedDomainAssignmentStore(inner: DomainAssignmentStore, ttl: number, clockValue: clock.Clock): DomainAssignmentStore {
  return new CachedDomainAssignmentStore(inner, cache.newTtlCache<DomainAssignment>(1024, ttl, clockValue), 0, 0);
}

/** Selects domain assignments. Empty fields match all. */
export class DomainAssignmentQuery {
  label: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMaximum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainAssignment): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainAssignment[]): DomainAssignment[] {
    const matched = collections.filter(items, (candidate: DomainAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainAssignments(store: DomainAssignmentStore, query: DomainAssignmentQuery): DomainAssignment[] {
  return query.apply(store.list());
}
