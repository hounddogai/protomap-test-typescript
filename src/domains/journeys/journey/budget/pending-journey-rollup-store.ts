import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingJourneyRollup } from "./pending-journey-rollup.js";

/** Keeps pending journey rollups by code. */
export interface PendingJourneyRollupStore {
  find(code: string): PendingJourneyRollup | undefined;
  save(item: PendingJourneyRollup): void;
  remove(code: string): boolean;
  list(): PendingJourneyRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingJourneyRollupStore implements PendingJourneyRollupStore {
  items: Map<string, PendingJourneyRollup>;
  order: string[];

  constructor(items: Map<string, PendingJourneyRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingJourneyRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingJourneyRollup): void {
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

  list(): PendingJourneyRollup[] {
    const out: PendingJourneyRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingJourneyRollupStore(): PendingJourneyRollupStore {
  return new MemoryPendingJourneyRollupStore(new Map<string, PendingJourneyRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingJourneyRollupStore implements PendingJourneyRollupStore {
  inner: PendingJourneyRollupStore;
  cache: cache.TtlCache<PendingJourneyRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingJourneyRollupStore,
    cacheValue: cache.TtlCache<PendingJourneyRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingJourneyRollup | undefined {
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

  save(item: PendingJourneyRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingJourneyRollup[] {
    return this.inner.list();
  }
}

export function newCachedPendingJourneyRollupStore(inner: PendingJourneyRollupStore, ttl: number, clockValue: clock.Clock): PendingJourneyRollupStore {
  return new CachedPendingJourneyRollupStore(
    inner,
    cache.newTtlCache<PendingJourneyRollup>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending journey rollups. Empty fields match all. */
export class PendingJourneyRollupQuery {
  unit: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minStartsAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingJourneyRollup): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingJourneyRollup[]): PendingJourneyRollup[] {
    const matched = collections.filter(items, (candidate: PendingJourneyRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingJourneyRollups(store: PendingJourneyRollupStore, query: PendingJourneyRollupQuery): PendingJourneyRollup[] {
  return query.apply(store.list());
}
