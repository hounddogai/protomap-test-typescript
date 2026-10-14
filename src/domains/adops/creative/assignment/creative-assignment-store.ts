import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeAssignment } from "./creative-assignment.js";

/** Keeps creative assignments by code. */
export interface CreativeAssignmentStore {
  find(code: string): CreativeAssignment | undefined;
  save(item: CreativeAssignment): void;
  remove(code: string): boolean;
  list(): CreativeAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeAssignmentStore implements CreativeAssignmentStore {
  items: Map<string, CreativeAssignment>;
  order: string[];

  constructor(items: Map<string, CreativeAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeAssignment): void {
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

  list(): CreativeAssignment[] {
    const out: CreativeAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeAssignmentStore(): CreativeAssignmentStore {
  return new MemoryCreativeAssignmentStore(new Map<string, CreativeAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeAssignmentStore implements CreativeAssignmentStore {
  inner: CreativeAssignmentStore;
  cache: cache.TtlCache<CreativeAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeAssignmentStore,
    cacheValue: cache.TtlCache<CreativeAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeAssignment | undefined {
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

  save(item: CreativeAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeAssignment[] {
    return this.inner.list();
  }
}

export function newCachedCreativeAssignmentStore(inner: CreativeAssignmentStore, ttl: number, clockValue: clock.Clock): CreativeAssignmentStore {
  return new CachedCreativeAssignmentStore(inner, cache.newTtlCache<CreativeAssignment>(128, ttl, clockValue), 0, 0);
}

/** Selects creative assignments. Empty fields match all. */
export class CreativeAssignmentQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeAssignment[]): CreativeAssignment[] {
    const matched = collections.filter(items, (candidate: CreativeAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeAssignments(store: CreativeAssignmentStore, query: CreativeAssignmentQuery): CreativeAssignment[] {
  return query.apply(store.list());
}
