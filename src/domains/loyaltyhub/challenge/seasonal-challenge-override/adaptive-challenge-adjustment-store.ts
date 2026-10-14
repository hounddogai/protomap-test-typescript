import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeAdjustment } from "./adaptive-challenge-adjustment.js";

/** Keeps adaptive challenge adjustments by code. */
export interface AdaptiveChallengeAdjustmentStore {
  find(code: string): AdaptiveChallengeAdjustment | undefined;
  save(item: AdaptiveChallengeAdjustment): void;
  remove(code: string): boolean;
  list(): AdaptiveChallengeAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveChallengeAdjustmentStore implements AdaptiveChallengeAdjustmentStore {
  items: Map<string, AdaptiveChallengeAdjustment>;
  order: string[];

  constructor(items: Map<string, AdaptiveChallengeAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveChallengeAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveChallengeAdjustment): void {
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

  list(): AdaptiveChallengeAdjustment[] {
    const out: AdaptiveChallengeAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveChallengeAdjustmentStore(): AdaptiveChallengeAdjustmentStore {
  return new MemoryAdaptiveChallengeAdjustmentStore(new Map<string, AdaptiveChallengeAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveChallengeAdjustmentStore implements AdaptiveChallengeAdjustmentStore {
  inner: AdaptiveChallengeAdjustmentStore;
  cache: cache.TtlCache<AdaptiveChallengeAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveChallengeAdjustmentStore,
    cacheValue: cache.TtlCache<AdaptiveChallengeAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveChallengeAdjustment | undefined {
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

  save(item: AdaptiveChallengeAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveChallengeAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveChallengeAdjustmentStore(inner: AdaptiveChallengeAdjustmentStore, ttl: number, clockValue: clock.Clock): AdaptiveChallengeAdjustmentStore {
  return new CachedAdaptiveChallengeAdjustmentStore(
    inner,
    cache.newTtlCache<AdaptiveChallengeAdjustment>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive challenge adjustments. Empty fields match all. */
export class AdaptiveChallengeAdjustmentQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveChallengeAdjustment): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveChallengeAdjustment[]): AdaptiveChallengeAdjustment[] {
    const matched = collections.filter(items, (candidate: AdaptiveChallengeAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveChallengeAdjustments(store: AdaptiveChallengeAdjustmentStore, query: AdaptiveChallengeAdjustmentQuery): AdaptiveChallengeAdjustment[] {
  return query.apply(store.list());
}
