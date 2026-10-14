import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingOptOutBaseline } from "./pending-opt-out-baseline.js";

/** Keeps pending opt out baselines by code. */
export interface PendingOptOutBaselineStore {
  find(code: string): PendingOptOutBaseline | undefined;
  save(item: PendingOptOutBaseline): void;
  remove(code: string): boolean;
  list(): PendingOptOutBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingOptOutBaselineStore implements PendingOptOutBaselineStore {
  items: Map<string, PendingOptOutBaseline>;
  order: string[];

  constructor(items: Map<string, PendingOptOutBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingOptOutBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingOptOutBaseline): void {
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

  list(): PendingOptOutBaseline[] {
    const out: PendingOptOutBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingOptOutBaselineStore(): PendingOptOutBaselineStore {
  return new MemoryPendingOptOutBaselineStore(new Map<string, PendingOptOutBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingOptOutBaselineStore implements PendingOptOutBaselineStore {
  inner: PendingOptOutBaselineStore;
  cache: cache.TtlCache<PendingOptOutBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingOptOutBaselineStore,
    cacheValue: cache.TtlCache<PendingOptOutBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingOptOutBaseline | undefined {
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

  save(item: PendingOptOutBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingOptOutBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPendingOptOutBaselineStore(inner: PendingOptOutBaselineStore, ttl: number, clockValue: clock.Clock): PendingOptOutBaselineStore {
  return new CachedPendingOptOutBaselineStore(
    inner,
    cache.newTtlCache<PendingOptOutBaseline>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending opt out baselines. Empty fields match all. */
export class PendingOptOutBaselineQuery {
  category: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAttempts: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingOptOutBaseline): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingOptOutBaseline[]): PendingOptOutBaseline[] {
    const matched = collections.filter(items, (candidate: PendingOptOutBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingOptOutBaselines(store: PendingOptOutBaselineStore, query: PendingOptOutBaselineQuery): PendingOptOutBaseline[] {
  return query.apply(store.list());
}
