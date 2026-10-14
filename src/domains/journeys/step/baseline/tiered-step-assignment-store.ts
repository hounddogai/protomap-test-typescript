import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredStepAssignment } from "./tiered-step-assignment.js";

/** Keeps tiered step assignments by code. */
export interface TieredStepAssignmentStore {
  find(code: string): TieredStepAssignment | undefined;
  save(item: TieredStepAssignment): void;
  remove(code: string): boolean;
  list(): TieredStepAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredStepAssignmentStore implements TieredStepAssignmentStore {
  items: Map<string, TieredStepAssignment>;
  order: string[];

  constructor(items: Map<string, TieredStepAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredStepAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredStepAssignment): void {
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

  list(): TieredStepAssignment[] {
    const out: TieredStepAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredStepAssignmentStore(): TieredStepAssignmentStore {
  return new MemoryTieredStepAssignmentStore(new Map<string, TieredStepAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredStepAssignmentStore implements TieredStepAssignmentStore {
  inner: TieredStepAssignmentStore;
  cache: cache.TtlCache<TieredStepAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredStepAssignmentStore,
    cacheValue: cache.TtlCache<TieredStepAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredStepAssignment | undefined {
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

  save(item: TieredStepAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredStepAssignment[] {
    return this.inner.list();
  }
}

export function newCachedTieredStepAssignmentStore(inner: TieredStepAssignmentStore, ttl: number, clockValue: clock.Clock): TieredStepAssignmentStore {
  return new CachedTieredStepAssignmentStore(
    inner,
    cache.newTtlCache<TieredStepAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered step assignments. Empty fields match all. */
export class TieredStepAssignmentQuery {
  channel: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredStepAssignment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredStepAssignment[]): TieredStepAssignment[] {
    const matched = collections.filter(items, (candidate: TieredStepAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredStepAssignments(store: TieredStepAssignmentStore, query: TieredStepAssignmentQuery): TieredStepAssignment[] {
  return query.apply(store.list());
}
