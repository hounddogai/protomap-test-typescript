import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingMacroAssignment } from "./rolling-macro-assignment.js";

/** Keeps rolling macro assignments by code. */
export interface RollingMacroAssignmentStore {
  find(code: string): RollingMacroAssignment | undefined;
  save(item: RollingMacroAssignment): void;
  remove(code: string): boolean;
  list(): RollingMacroAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingMacroAssignmentStore implements RollingMacroAssignmentStore {
  items: Map<string, RollingMacroAssignment>;
  order: string[];

  constructor(items: Map<string, RollingMacroAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingMacroAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingMacroAssignment): void {
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

  list(): RollingMacroAssignment[] {
    const out: RollingMacroAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingMacroAssignmentStore(): RollingMacroAssignmentStore {
  return new MemoryRollingMacroAssignmentStore(new Map<string, RollingMacroAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingMacroAssignmentStore implements RollingMacroAssignmentStore {
  inner: RollingMacroAssignmentStore;
  cache: cache.TtlCache<RollingMacroAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingMacroAssignmentStore,
    cacheValue: cache.TtlCache<RollingMacroAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingMacroAssignment | undefined {
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

  save(item: RollingMacroAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingMacroAssignment[] {
    return this.inner.list();
  }
}

export function newCachedRollingMacroAssignmentStore(inner: RollingMacroAssignmentStore, ttl: number, clockValue: clock.Clock): RollingMacroAssignmentStore {
  return new CachedRollingMacroAssignmentStore(
    inner,
    cache.newTtlCache<RollingMacroAssignment>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling macro assignments. Empty fields match all. */
export class RollingMacroAssignmentQuery {
  channel: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCapacity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingMacroAssignment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingMacroAssignment[]): RollingMacroAssignment[] {
    const matched = collections.filter(items, (candidate: RollingMacroAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingMacroAssignments(store: RollingMacroAssignmentStore, query: RollingMacroAssignmentQuery): RollingMacroAssignment[] {
  return query.apply(store.list());
}
