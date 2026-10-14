import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveCsatMilestone } from "./adaptive-csat-milestone.js";

/** Keeps adaptive csat milestones by code. */
export interface AdaptiveCsatMilestoneStore {
  find(code: string): AdaptiveCsatMilestone | undefined;
  save(item: AdaptiveCsatMilestone): void;
  remove(code: string): boolean;
  list(): AdaptiveCsatMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveCsatMilestoneStore implements AdaptiveCsatMilestoneStore {
  items: Map<string, AdaptiveCsatMilestone>;
  order: string[];

  constructor(items: Map<string, AdaptiveCsatMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveCsatMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveCsatMilestone): void {
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

  list(): AdaptiveCsatMilestone[] {
    const out: AdaptiveCsatMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveCsatMilestoneStore(): AdaptiveCsatMilestoneStore {
  return new MemoryAdaptiveCsatMilestoneStore(new Map<string, AdaptiveCsatMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveCsatMilestoneStore implements AdaptiveCsatMilestoneStore {
  inner: AdaptiveCsatMilestoneStore;
  cache: cache.TtlCache<AdaptiveCsatMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveCsatMilestoneStore,
    cacheValue: cache.TtlCache<AdaptiveCsatMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveCsatMilestone | undefined {
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

  save(item: AdaptiveCsatMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveCsatMilestone[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveCsatMilestoneStore(inner: AdaptiveCsatMilestoneStore, ttl: number, clockValue: clock.Clock): AdaptiveCsatMilestoneStore {
  return new CachedAdaptiveCsatMilestoneStore(
    inner,
    cache.newTtlCache<AdaptiveCsatMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive csat milestones. Empty fields match all. */
export class AdaptiveCsatMilestoneQuery {
  source: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minLimit: number, statuses: string[], limit: number) {
    this.source = source;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveCsatMilestone): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveCsatMilestone[]): AdaptiveCsatMilestone[] {
    const matched = collections.filter(items, (candidate: AdaptiveCsatMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveCsatMilestones(store: AdaptiveCsatMilestoneStore, query: AdaptiveCsatMilestoneQuery): AdaptiveCsatMilestone[] {
  return query.apply(store.list());
}
