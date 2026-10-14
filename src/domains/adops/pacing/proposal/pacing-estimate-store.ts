import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PacingEstimate } from "./pacing-estimate.js";

/** Keeps pacing estimates by code. */
export interface PacingEstimateStore {
  find(code: string): PacingEstimate | undefined;
  save(item: PacingEstimate): void;
  remove(code: string): boolean;
  list(): PacingEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPacingEstimateStore implements PacingEstimateStore {
  items: Map<string, PacingEstimate>;
  order: string[];

  constructor(items: Map<string, PacingEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PacingEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PacingEstimate): void {
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

  list(): PacingEstimate[] {
    const out: PacingEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPacingEstimateStore(): PacingEstimateStore {
  return new MemoryPacingEstimateStore(new Map<string, PacingEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPacingEstimateStore implements PacingEstimateStore {
  inner: PacingEstimateStore;
  cache: cache.TtlCache<PacingEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PacingEstimateStore,
    cacheValue: cache.TtlCache<PacingEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PacingEstimate | undefined {
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

  save(item: PacingEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PacingEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPacingEstimateStore(inner: PacingEstimateStore, ttl: number, clockValue: clock.Clock): PacingEstimateStore {
  return new CachedPacingEstimateStore(inner, cache.newTtlCache<PacingEstimate>(1024, ttl, clockValue), 0, 0);
}

/** Selects pacing estimates. Empty fields match all. */
export class PacingEstimateQuery {
  region: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PacingEstimate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PacingEstimate[]): PacingEstimate[] {
    const matched = collections.filter(items, (candidate: PacingEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPacingEstimates(store: PacingEstimateStore, query: PacingEstimateQuery): PacingEstimate[] {
  return query.apply(store.list());
}
