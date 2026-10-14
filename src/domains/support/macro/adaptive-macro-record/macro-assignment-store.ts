import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { MacroAssignment } from "./macro-assignment.js";

/** Keeps macro assignments by code. */
export interface MacroAssignmentStore {
  find(code: string): MacroAssignment | undefined;
  save(item: MacroAssignment): void;
  remove(code: string): boolean;
  list(): MacroAssignment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryMacroAssignmentStore implements MacroAssignmentStore {
  items: Map<string, MacroAssignment>;
  order: string[];

  constructor(items: Map<string, MacroAssignment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): MacroAssignment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: MacroAssignment): void {
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

  list(): MacroAssignment[] {
    const out: MacroAssignment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryMacroAssignmentStore(): MacroAssignmentStore {
  return new MemoryMacroAssignmentStore(new Map<string, MacroAssignment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedMacroAssignmentStore implements MacroAssignmentStore {
  inner: MacroAssignmentStore;
  cache: cache.TtlCache<MacroAssignment>;
  hits: number;
  misses: number;

  constructor(
    inner: MacroAssignmentStore,
    cacheValue: cache.TtlCache<MacroAssignment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): MacroAssignment | undefined {
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

  save(item: MacroAssignment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): MacroAssignment[] {
    return this.inner.list();
  }
}

export function newCachedMacroAssignmentStore(inner: MacroAssignmentStore, ttl: number, clockValue: clock.Clock): MacroAssignmentStore {
  return new CachedMacroAssignmentStore(inner, cache.newTtlCache<MacroAssignment>(64, ttl, clockValue), 0, 0);
}

/** Selects macro assignments. Empty fields match all. */
export class MacroAssignmentQuery {
  unit: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minWindowDays: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: MacroAssignment): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: MacroAssignment[]): MacroAssignment[] {
    const matched = collections.filter(items, (candidate: MacroAssignment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findMacroAssignments(store: MacroAssignmentStore, query: MacroAssignmentQuery): MacroAssignment[] {
  return query.apply(store.list());
}
