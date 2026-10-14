import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBranchCycle } from "./lenient-branch-cycle.js";

/** Keeps lenient branch cycles by code. */
export interface LenientBranchCycleStore {
  find(code: string): LenientBranchCycle | undefined;
  save(item: LenientBranchCycle): void;
  remove(code: string): boolean;
  list(): LenientBranchCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBranchCycleStore implements LenientBranchCycleStore {
  items: Map<string, LenientBranchCycle>;
  order: string[];

  constructor(items: Map<string, LenientBranchCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBranchCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBranchCycle): void {
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

  list(): LenientBranchCycle[] {
    const out: LenientBranchCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBranchCycleStore(): LenientBranchCycleStore {
  return new MemoryLenientBranchCycleStore(new Map<string, LenientBranchCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBranchCycleStore implements LenientBranchCycleStore {
  inner: LenientBranchCycleStore;
  cache: cache.TtlCache<LenientBranchCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBranchCycleStore,
    cacheValue: cache.TtlCache<LenientBranchCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBranchCycle | undefined {
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

  save(item: LenientBranchCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBranchCycle[] {
    return this.inner.list();
  }
}

export function newCachedLenientBranchCycleStore(inner: LenientBranchCycleStore, ttl: number, clockValue: clock.Clock): LenientBranchCycleStore {
  return new CachedLenientBranchCycleStore(inner, cache.newTtlCache<LenientBranchCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient branch cycles. Empty fields match all. */
export class LenientBranchCycleQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBranchCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBranchCycle[]): LenientBranchCycle[] {
    const matched = collections.filter(items, (candidate: LenientBranchCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBranchCycles(store: LenientBranchCycleStore, query: LenientBranchCycleQuery): LenientBranchCycle[] {
  return query.apply(store.list());
}
