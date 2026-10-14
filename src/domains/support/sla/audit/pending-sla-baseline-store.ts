import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSlaBaseline } from "./pending-sla-baseline.js";

/** Keeps pending sla baselines by code. */
export interface PendingSlaBaselineStore {
  find(code: string): PendingSlaBaseline | undefined;
  save(item: PendingSlaBaseline): void;
  remove(code: string): boolean;
  list(): PendingSlaBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSlaBaselineStore implements PendingSlaBaselineStore {
  items: Map<string, PendingSlaBaseline>;
  order: string[];

  constructor(items: Map<string, PendingSlaBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSlaBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSlaBaseline): void {
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

  list(): PendingSlaBaseline[] {
    const out: PendingSlaBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSlaBaselineStore(): PendingSlaBaselineStore {
  return new MemoryPendingSlaBaselineStore(new Map<string, PendingSlaBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSlaBaselineStore implements PendingSlaBaselineStore {
  inner: PendingSlaBaselineStore;
  cache: cache.TtlCache<PendingSlaBaseline>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSlaBaselineStore,
    cacheValue: cache.TtlCache<PendingSlaBaseline>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSlaBaseline | undefined {
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

  save(item: PendingSlaBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSlaBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPendingSlaBaselineStore(inner: PendingSlaBaselineStore, ttl: number, clockValue: clock.Clock): PendingSlaBaselineStore {
  return new CachedPendingSlaBaselineStore(inner, cache.newTtlCache<PendingSlaBaseline>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending sla baselines. Empty fields match all. */
export class PendingSlaBaselineQuery {
  unit: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMinimum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSlaBaseline): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSlaBaseline[]): PendingSlaBaseline[] {
    const matched = collections.filter(items, (candidate: PendingSlaBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSlaBaselines(store: PendingSlaBaselineStore, query: PendingSlaBaselineQuery): PendingSlaBaseline[] {
  return query.apply(store.list());
}
