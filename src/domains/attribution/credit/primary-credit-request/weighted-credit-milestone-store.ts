import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCreditMilestone } from "./weighted-credit-milestone.js";

/** Keeps weighted credit milestones by code. */
export interface WeightedCreditMilestoneStore {
  find(code: string): WeightedCreditMilestone | undefined;
  save(item: WeightedCreditMilestone): void;
  remove(code: string): boolean;
  list(): WeightedCreditMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCreditMilestoneStore implements WeightedCreditMilestoneStore {
  items: Map<string, WeightedCreditMilestone>;
  order: string[];

  constructor(items: Map<string, WeightedCreditMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCreditMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCreditMilestone): void {
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

  list(): WeightedCreditMilestone[] {
    const out: WeightedCreditMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCreditMilestoneStore(): WeightedCreditMilestoneStore {
  return new MemoryWeightedCreditMilestoneStore(new Map<string, WeightedCreditMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCreditMilestoneStore implements WeightedCreditMilestoneStore {
  inner: WeightedCreditMilestoneStore;
  cache: cache.TtlCache<WeightedCreditMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCreditMilestoneStore,
    cacheValue: cache.TtlCache<WeightedCreditMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCreditMilestone | undefined {
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

  save(item: WeightedCreditMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCreditMilestone[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCreditMilestoneStore(inner: WeightedCreditMilestoneStore, ttl: number, clockValue: clock.Clock): WeightedCreditMilestoneStore {
  return new CachedWeightedCreditMilestoneStore(
    inner,
    cache.newTtlCache<WeightedCreditMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted credit milestones. Empty fields match all. */
export class WeightedCreditMilestoneQuery {
  region: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minStartsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCreditMilestone): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCreditMilestone[]): WeightedCreditMilestone[] {
    const matched = collections.filter(items, (candidate: WeightedCreditMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCreditMilestones(store: WeightedCreditMilestoneStore, query: WeightedCreditMilestoneQuery): WeightedCreditMilestone[] {
  return query.apply(store.list());
}
