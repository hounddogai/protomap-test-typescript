import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryInviteAssignment } from "./primary-invite-assignment.js";

/** Keeps primary invite assignments by code. */
export interface PrimaryInviteAssignmentStore {
  find(code: string): PrimaryInviteAssignment | undefined;
  save(item: PrimaryInviteAssignment): void;
  remove(code: string): boolean;
  list(): PrimaryInviteAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryInviteAssignmentStore implements PrimaryInviteAssignmentStore {
  items: Map<string, PrimaryInviteAssignment>;
  order: string[];

  constructor(items: Map<string, PrimaryInviteAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryInviteAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryInviteAssignment): void {
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

  list(): PrimaryInviteAssignment[] {
    const out: PrimaryInviteAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryInviteAssignmentStore(): PrimaryInviteAssignmentStore {
  return new MemoryPrimaryInviteAssignmentStore(new Map<string, PrimaryInviteAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryInviteAssignmentStore implements PrimaryInviteAssignmentStore {
  inner: PrimaryInviteAssignmentStore;
  cache: cache.TtlCache<PrimaryInviteAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryInviteAssignmentStore,
    cacheValue: cache.TtlCache<PrimaryInviteAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryInviteAssignment | undefined {
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

  save(item: PrimaryInviteAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryInviteAssignment[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryInviteAssignmentStore(inner: PrimaryInviteAssignmentStore, ttl: number, clockValue: clock.Clock): PrimaryInviteAssignmentStore {
  return new CachedPrimaryInviteAssignmentStore(
    inner,
    cache.newTtlCache<PrimaryInviteAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary invite assignments. Empty fields match all. */
export class PrimaryInviteAssignmentQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryInviteAssignment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryInviteAssignment[]): PrimaryInviteAssignment[] {
    const matched = collections.filter(items, (candidate: PrimaryInviteAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryInviteAssignments(store: PrimaryInviteAssignmentStore, query: PrimaryInviteAssignmentQuery): PrimaryInviteAssignment[] {
  return query.apply(store.list());
}
