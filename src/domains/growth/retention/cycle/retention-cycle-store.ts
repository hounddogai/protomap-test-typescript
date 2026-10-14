import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionCycle } from "./retention-cycle.js";

/** Keeps retention cycles by code. */
export interface RetentionCycleStore {
  find(code: string): RetentionCycle | undefined;
  save(item: RetentionCycle): void;
  remove(code: string): boolean;
  list(): RetentionCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionCycleStore implements RetentionCycleStore {
  items: Map<string, RetentionCycle>;
  order: string[];

  constructor(items: Map<string, RetentionCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionCycle): void {
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

  list(): RetentionCycle[] {
    const out: RetentionCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionCycleStore(): RetentionCycleStore {
  return new MemoryRetentionCycleStore(new Map<string, RetentionCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionCycleStore implements RetentionCycleStore {
  inner: RetentionCycleStore;
  cache: cache.TtlCache<RetentionCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionCycleStore,
    cacheValue: cache.TtlCache<RetentionCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionCycle | undefined {
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

  save(item: RetentionCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionCycle[] {
    return this.inner.list();
  }
}

export function newCachedRetentionCycleStore(inner: RetentionCycleStore, ttl: number, clockValue: clock.Clock): RetentionCycleStore {
  return new CachedRetentionCycleStore(inner, cache.newTtlCache<RetentionCycle>(128, ttl, clockValue), 0, 0);
}

/** Selects retention cycles. Empty fields match all. */
export class RetentionCycleQuery {
  name: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRatio: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionCycle): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionCycle[]): RetentionCycle[] {
    const matched = collections.filter(items, (candidate: RetentionCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionCycles(store: RetentionCycleStore, query: RetentionCycleQuery): RetentionCycle[] {
  return query.apply(store.list());
}
