import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyAssignment } from "./reply-assignment.js";

/** Keeps reply assignments by code. */
export interface ReplyAssignmentStore {
  find(code: string): ReplyAssignment | undefined;
  save(item: ReplyAssignment): void;
  remove(code: string): boolean;
  list(): ReplyAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyAssignmentStore implements ReplyAssignmentStore {
  items: Map<string, ReplyAssignment>;
  order: string[];

  constructor(items: Map<string, ReplyAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyAssignment): void {
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

  list(): ReplyAssignment[] {
    const out: ReplyAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyAssignmentStore(): ReplyAssignmentStore {
  return new MemoryReplyAssignmentStore(new Map<string, ReplyAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyAssignmentStore implements ReplyAssignmentStore {
  inner: ReplyAssignmentStore;
  cache: cache.TtlCache<ReplyAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: ReplyAssignmentStore,
    cacheValue: cache.TtlCache<ReplyAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyAssignment | undefined {
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

  save(item: ReplyAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyAssignment[] {
    return this.inner.list();
  }
}

export function newCachedReplyAssignmentStore(inner: ReplyAssignmentStore, ttl: number, clockValue: clock.Clock): ReplyAssignmentStore {
  return new CachedReplyAssignmentStore(inner, cache.newTtlCache<ReplyAssignment>(128, ttl, clockValue), 0, 0);
}

/** Selects reply assignments. Empty fields match all. */
export class ReplyAssignmentQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyAssignment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyAssignment[]): ReplyAssignment[] {
    const matched = collections.filter(items, (candidate: ReplyAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyAssignments(store: ReplyAssignmentStore, query: ReplyAssignmentQuery): ReplyAssignment[] {
  return query.apply(store.list());
}
