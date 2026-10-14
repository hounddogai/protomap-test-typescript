import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPostAssignment } from "./default-post-assignment.js";

/** Keeps default post assignments by code. */
export interface DefaultPostAssignmentStore {
  find(code: string): DefaultPostAssignment | undefined;
  save(item: DefaultPostAssignment): void;
  remove(code: string): boolean;
  list(): DefaultPostAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPostAssignmentStore implements DefaultPostAssignmentStore {
  items: Map<string, DefaultPostAssignment>;
  order: string[];

  constructor(items: Map<string, DefaultPostAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPostAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPostAssignment): void {
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

  list(): DefaultPostAssignment[] {
    const out: DefaultPostAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPostAssignmentStore(): DefaultPostAssignmentStore {
  return new MemoryDefaultPostAssignmentStore(new Map<string, DefaultPostAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPostAssignmentStore implements DefaultPostAssignmentStore {
  inner: DefaultPostAssignmentStore;
  cache: cache.TtlCache<DefaultPostAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPostAssignmentStore,
    cacheValue: cache.TtlCache<DefaultPostAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPostAssignment | undefined {
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

  save(item: DefaultPostAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPostAssignment[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPostAssignmentStore(inner: DefaultPostAssignmentStore, ttl: number, clockValue: clock.Clock): DefaultPostAssignmentStore {
  return new CachedDefaultPostAssignmentStore(
    inner,
    cache.newTtlCache<DefaultPostAssignment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default post assignments. Empty fields match all. */
export class DefaultPostAssignmentQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPostAssignment): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPostAssignment[]): DefaultPostAssignment[] {
    const matched = collections.filter(items, (candidate: DefaultPostAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPostAssignments(store: DefaultPostAssignmentStore, query: DefaultPostAssignmentQuery): DefaultPostAssignment[] {
  return query.apply(store.list());
}
