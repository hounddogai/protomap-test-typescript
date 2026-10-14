import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWaitCycle } from "./scheduled-wait-cycle.js";

/** Keeps scheduled wait cycles by code. */
export interface ScheduledWaitCycleStore {
  find(code: string): ScheduledWaitCycle | undefined;
  save(item: ScheduledWaitCycle): void;
  remove(code: string): boolean;
  list(): ScheduledWaitCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWaitCycleStore implements ScheduledWaitCycleStore {
  items: Map<string, ScheduledWaitCycle>;
  order: string[];

  constructor(items: Map<string, ScheduledWaitCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWaitCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWaitCycle): void {
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

  list(): ScheduledWaitCycle[] {
    const out: ScheduledWaitCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWaitCycleStore(): ScheduledWaitCycleStore {
  return new MemoryScheduledWaitCycleStore(new Map<string, ScheduledWaitCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWaitCycleStore implements ScheduledWaitCycleStore {
  inner: ScheduledWaitCycleStore;
  cache: cache.TtlCache<ScheduledWaitCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWaitCycleStore,
    cacheValue: cache.TtlCache<ScheduledWaitCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWaitCycle | undefined {
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

  save(item: ScheduledWaitCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWaitCycle[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWaitCycleStore(inner: ScheduledWaitCycleStore, ttl: number, clockValue: clock.Clock): ScheduledWaitCycleStore {
  return new CachedScheduledWaitCycleStore(inner, cache.newTtlCache<ScheduledWaitCycle>(512, ttl, clockValue), 0, 0);
}

/** Selects scheduled wait cycles. Empty fields match all. */
export class ScheduledWaitCycleQuery {
  country: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMinimum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWaitCycle): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWaitCycle[]): ScheduledWaitCycle[] {
    const matched = collections.filter(items, (candidate: ScheduledWaitCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWaitCycles(store: ScheduledWaitCycleStore, query: ScheduledWaitCycleQuery): ScheduledWaitCycle[] {
  return query.apply(store.list());
}
