import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSubscriptionMilestone } from "./lenient-subscription-milestone.js";

/** Keeps lenient subscription milestones by code. */
export interface LenientSubscriptionMilestoneStore {
  find(code: string): LenientSubscriptionMilestone | undefined;
  save(item: LenientSubscriptionMilestone): void;
  remove(code: string): boolean;
  list(): LenientSubscriptionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSubscriptionMilestoneStore implements LenientSubscriptionMilestoneStore {
  items: Map<string, LenientSubscriptionMilestone>;
  order: string[];

  constructor(items: Map<string, LenientSubscriptionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSubscriptionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSubscriptionMilestone): void {
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

  list(): LenientSubscriptionMilestone[] {
    const out: LenientSubscriptionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSubscriptionMilestoneStore(): LenientSubscriptionMilestoneStore {
  return new MemoryLenientSubscriptionMilestoneStore(new Map<string, LenientSubscriptionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSubscriptionMilestoneStore implements LenientSubscriptionMilestoneStore {
  inner: LenientSubscriptionMilestoneStore;
  cache: cache.TtlCache<LenientSubscriptionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSubscriptionMilestoneStore,
    cacheValue: cache.TtlCache<LenientSubscriptionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSubscriptionMilestone | undefined {
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

  save(item: LenientSubscriptionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSubscriptionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLenientSubscriptionMilestoneStore(inner: LenientSubscriptionMilestoneStore, ttl: number, clockValue: clock.Clock): LenientSubscriptionMilestoneStore {
  return new CachedLenientSubscriptionMilestoneStore(
    inner,
    cache.newTtlCache<LenientSubscriptionMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient subscription milestones. Empty fields match all. */
export class LenientSubscriptionMilestoneQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSubscriptionMilestone): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSubscriptionMilestone[]): LenientSubscriptionMilestone[] {
    const matched = collections.filter(items, (candidate: LenientSubscriptionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSubscriptionMilestones(store: LenientSubscriptionMilestoneStore, query: LenientSubscriptionMilestoneQuery): LenientSubscriptionMilestone[] {
  return query.apply(store.list());
}
