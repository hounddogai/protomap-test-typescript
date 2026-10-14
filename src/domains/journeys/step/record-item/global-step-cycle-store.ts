import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalStepCycle } from "./global-step-cycle.js";

/** Keeps global step cycles by code. */
export interface GlobalStepCycleStore {
  find(code: string): GlobalStepCycle | undefined;
  save(item: GlobalStepCycle): void;
  remove(code: string): boolean;
  list(): GlobalStepCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalStepCycleStore implements GlobalStepCycleStore {
  items: Map<string, GlobalStepCycle>;
  order: string[];

  constructor(items: Map<string, GlobalStepCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalStepCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalStepCycle): void {
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

  list(): GlobalStepCycle[] {
    const out: GlobalStepCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalStepCycleStore(): GlobalStepCycleStore {
  return new MemoryGlobalStepCycleStore(new Map<string, GlobalStepCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalStepCycleStore implements GlobalStepCycleStore {
  inner: GlobalStepCycleStore;
  cache: cache.TtlCache<GlobalStepCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalStepCycleStore,
    cacheValue: cache.TtlCache<GlobalStepCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalStepCycle | undefined {
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

  save(item: GlobalStepCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalStepCycle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalStepCycleStore(inner: GlobalStepCycleStore, ttl: number, clockValue: clock.Clock): GlobalStepCycleStore {
  return new CachedGlobalStepCycleStore(inner, cache.newTtlCache<GlobalStepCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects global step cycles. Empty fields match all. */
export class GlobalStepCycleQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalStepCycle): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalStepCycle[]): GlobalStepCycle[] {
    const matched = collections.filter(items, (candidate: GlobalStepCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalStepCycles(store: GlobalStepCycleStore, query: GlobalStepCycleQuery): GlobalStepCycle[] {
  return query.apply(store.list());
}
