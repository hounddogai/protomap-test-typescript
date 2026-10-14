import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

/** Keeps tiered double opt in assignments by code. */
export interface TieredDoubleOptInAssignmentStore {
  find(code: string): TieredDoubleOptInAssignment | undefined;
  save(item: TieredDoubleOptInAssignment): void;
  remove(code: string): boolean;
  list(): TieredDoubleOptInAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredDoubleOptInAssignmentStore implements TieredDoubleOptInAssignmentStore {
  items: Map<string, TieredDoubleOptInAssignment>;
  order: string[];

  constructor(items: Map<string, TieredDoubleOptInAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredDoubleOptInAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredDoubleOptInAssignment): void {
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

  list(): TieredDoubleOptInAssignment[] {
    const out: TieredDoubleOptInAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredDoubleOptInAssignmentStore(): TieredDoubleOptInAssignmentStore {
  return new MemoryTieredDoubleOptInAssignmentStore(new Map<string, TieredDoubleOptInAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredDoubleOptInAssignmentStore implements TieredDoubleOptInAssignmentStore {
  inner: TieredDoubleOptInAssignmentStore;
  cache: cache.TtlCache<TieredDoubleOptInAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredDoubleOptInAssignmentStore,
    cacheValue: cache.TtlCache<TieredDoubleOptInAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredDoubleOptInAssignment | undefined {
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

  save(item: TieredDoubleOptInAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredDoubleOptInAssignment[] {
    return this.inner.list();
  }
}

export function newCachedTieredDoubleOptInAssignmentStore(inner: TieredDoubleOptInAssignmentStore, ttl: number, clockValue: clock.Clock): TieredDoubleOptInAssignmentStore {
  return new CachedTieredDoubleOptInAssignmentStore(
    inner,
    cache.newTtlCache<TieredDoubleOptInAssignment>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered double opt in assignments. Empty fields match all. */
export class TieredDoubleOptInAssignmentQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredDoubleOptInAssignment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredDoubleOptInAssignment[]): TieredDoubleOptInAssignment[] {
    const matched = collections.filter(items, (candidate: TieredDoubleOptInAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredDoubleOptInAssignments(store: TieredDoubleOptInAssignmentStore, query: TieredDoubleOptInAssignmentQuery): TieredDoubleOptInAssignment[] {
  return query.apply(store.list());
}
