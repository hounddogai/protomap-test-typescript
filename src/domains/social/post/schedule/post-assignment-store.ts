import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PostAssignment } from "./post-assignment.js";

/** Keeps post assignments by code. */
export interface PostAssignmentStore {
  find(code: string): PostAssignment | undefined;
  save(item: PostAssignment): void;
  remove(code: string): boolean;
  list(): PostAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPostAssignmentStore implements PostAssignmentStore {
  items: Map<string, PostAssignment>;
  order: string[];

  constructor(items: Map<string, PostAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PostAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PostAssignment): void {
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

  list(): PostAssignment[] {
    const out: PostAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPostAssignmentStore(): PostAssignmentStore {
  return new MemoryPostAssignmentStore(new Map<string, PostAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPostAssignmentStore implements PostAssignmentStore {
  inner: PostAssignmentStore;
  cache: cache.TtlCache<PostAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PostAssignmentStore,
    cacheValue: cache.TtlCache<PostAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PostAssignment | undefined {
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

  save(item: PostAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PostAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPostAssignmentStore(inner: PostAssignmentStore, ttl: number, clockValue: clock.Clock): PostAssignmentStore {
  return new CachedPostAssignmentStore(inner, cache.newTtlCache<PostAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects post assignments. Empty fields match all. */
export class PostAssignmentQuery {
  country: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minStartsAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PostAssignment): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PostAssignment[]): PostAssignment[] {
    const matched = collections.filter(items, (candidate: PostAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPostAssignments(store: PostAssignmentStore, query: PostAssignmentQuery): PostAssignment[] {
  return query.apply(store.list());
}
