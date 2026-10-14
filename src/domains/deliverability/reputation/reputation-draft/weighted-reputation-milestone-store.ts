import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReputationMilestone } from "./weighted-reputation-milestone.js";

/** Keeps weighted reputation milestones by code. */
export interface WeightedReputationMilestoneStore {
  find(code: string): WeightedReputationMilestone | undefined;
  save(item: WeightedReputationMilestone): void;
  remove(code: string): boolean;
  list(): WeightedReputationMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReputationMilestoneStore implements WeightedReputationMilestoneStore {
  items: Map<string, WeightedReputationMilestone>;
  order: string[];

  constructor(items: Map<string, WeightedReputationMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReputationMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReputationMilestone): void {
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

  list(): WeightedReputationMilestone[] {
    const out: WeightedReputationMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReputationMilestoneStore(): WeightedReputationMilestoneStore {
  return new MemoryWeightedReputationMilestoneStore(new Map<string, WeightedReputationMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReputationMilestoneStore implements WeightedReputationMilestoneStore {
  inner: WeightedReputationMilestoneStore;
  cache: cache.TtlCache<WeightedReputationMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReputationMilestoneStore,
    cacheValue: cache.TtlCache<WeightedReputationMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReputationMilestone | undefined {
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

  save(item: WeightedReputationMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReputationMilestone[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReputationMilestoneStore(inner: WeightedReputationMilestoneStore, ttl: number, clockValue: clock.Clock): WeightedReputationMilestoneStore {
  return new CachedWeightedReputationMilestoneStore(
    inner,
    cache.newTtlCache<WeightedReputationMilestone>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reputation milestones. Empty fields match all. */
export class WeightedReputationMilestoneQuery {
  country: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReputationMilestone): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReputationMilestone[]): WeightedReputationMilestone[] {
    const matched = collections.filter(items, (candidate: WeightedReputationMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReputationMilestones(store: WeightedReputationMilestoneStore, query: WeightedReputationMilestoneQuery): WeightedReputationMilestone[] {
  return query.apply(store.list());
}
