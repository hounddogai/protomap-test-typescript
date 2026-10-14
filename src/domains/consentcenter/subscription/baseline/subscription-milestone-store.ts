import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionMilestone } from "./subscription-milestone.js";

/** Keeps subscription milestones by code. */
export interface SubscriptionMilestoneStore {
  find(code: string): SubscriptionMilestone | undefined;
  save(item: SubscriptionMilestone): void;
  remove(code: string): boolean;
  list(): SubscriptionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionMilestoneStore implements SubscriptionMilestoneStore {
  items: Map<string, SubscriptionMilestone>;
  order: string[];

  constructor(items: Map<string, SubscriptionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionMilestone): void {
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

  list(): SubscriptionMilestone[] {
    const out: SubscriptionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionMilestoneStore(): SubscriptionMilestoneStore {
  return new MemorySubscriptionMilestoneStore(new Map<string, SubscriptionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionMilestoneStore implements SubscriptionMilestoneStore {
  inner: SubscriptionMilestoneStore;
  cache: cache.TtlCache<SubscriptionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionMilestoneStore,
    cacheValue: cache.TtlCache<SubscriptionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionMilestone | undefined {
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

  save(item: SubscriptionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionMilestoneStore(inner: SubscriptionMilestoneStore, ttl: number, clockValue: clock.Clock): SubscriptionMilestoneStore {
  return new CachedSubscriptionMilestoneStore(
    inner,
    cache.newTtlCache<SubscriptionMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription milestones. Empty fields match all. */
export class SubscriptionMilestoneQuery {
  country: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minQuantity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionMilestone): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionMilestone[]): SubscriptionMilestone[] {
    const matched = collections.filter(items, (candidate: SubscriptionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionMilestones(store: SubscriptionMilestoneStore, query: SubscriptionMilestoneQuery): SubscriptionMilestone[] {
  return query.apply(store.list());
}
