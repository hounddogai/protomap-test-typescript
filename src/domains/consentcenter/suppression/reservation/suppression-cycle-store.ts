import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionCycle } from "./suppression-cycle.js";

/** Keeps suppression cycles by code. */
export interface SuppressionCycleStore {
  find(code: string): SuppressionCycle | undefined;
  save(item: SuppressionCycle): void;
  remove(code: string): boolean;
  list(): SuppressionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionCycleStore implements SuppressionCycleStore {
  items: Map<string, SuppressionCycle>;
  order: string[];

  constructor(items: Map<string, SuppressionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionCycle): void {
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

  list(): SuppressionCycle[] {
    const out: SuppressionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionCycleStore(): SuppressionCycleStore {
  return new MemorySuppressionCycleStore(new Map<string, SuppressionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionCycleStore implements SuppressionCycleStore {
  inner: SuppressionCycleStore;
  cache: cache.TtlCache<SuppressionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionCycleStore,
    cacheValue: cache.TtlCache<SuppressionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionCycle | undefined {
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

  save(item: SuppressionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionCycle[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionCycleStore(inner: SuppressionCycleStore, ttl: number, clockValue: clock.Clock): SuppressionCycleStore {
  return new CachedSuppressionCycleStore(inner, cache.newTtlCache<SuppressionCycle>(1024, ttl, clockValue), 0, 0);
}

/** Selects suppression cycles. Empty fields match all. */
export class SuppressionCycleQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionCycle): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionCycle[]): SuppressionCycle[] {
    const matched = collections.filter(items, (candidate: SuppressionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionCycles(store: SuppressionCycleStore, query: SuppressionCycleQuery): SuppressionCycle[] {
  return query.apply(store.list());
}
