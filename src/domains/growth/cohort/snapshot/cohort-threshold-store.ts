import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortThreshold } from "./cohort-threshold.js";

/** Keeps cohort thresholds by code. */
export interface CohortThresholdStore {
  find(code: string): CohortThreshold | undefined;
  save(item: CohortThreshold): void;
  remove(code: string): boolean;
  list(): CohortThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortThresholdStore implements CohortThresholdStore {
  items: Map<string, CohortThreshold>;
  order: string[];

  constructor(items: Map<string, CohortThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortThreshold): void {
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

  list(): CohortThreshold[] {
    const out: CohortThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortThresholdStore(): CohortThresholdStore {
  return new MemoryCohortThresholdStore(new Map<string, CohortThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortThresholdStore implements CohortThresholdStore {
  inner: CohortThresholdStore;
  cache: cache.TtlCache<CohortThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortThresholdStore,
    cacheValue: cache.TtlCache<CohortThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortThreshold | undefined {
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

  save(item: CohortThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortThreshold[] {
    return this.inner.list();
  }
}

export function newCachedCohortThresholdStore(inner: CohortThresholdStore, ttl: number, clockValue: clock.Clock): CohortThresholdStore {
  return new CachedCohortThresholdStore(inner, cache.newTtlCache<CohortThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort thresholds. Empty fields match all. */
export class CohortThresholdQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortThreshold): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortThreshold[]): CohortThreshold[] {
    const matched = collections.filter(items, (candidate: CohortThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortThresholds(store: CohortThresholdStore, query: CohortThresholdQuery): CohortThreshold[] {
  return query.apply(store.list());
}
