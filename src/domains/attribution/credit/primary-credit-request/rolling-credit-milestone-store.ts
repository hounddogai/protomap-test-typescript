import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCreditMilestone } from "./rolling-credit-milestone.js";

/** Keeps rolling credit milestones by code. */
export interface RollingCreditMilestoneStore {
  find(code: string): RollingCreditMilestone | undefined;
  save(item: RollingCreditMilestone): void;
  remove(code: string): boolean;
  list(): RollingCreditMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCreditMilestoneStore implements RollingCreditMilestoneStore {
  items: Map<string, RollingCreditMilestone>;
  order: string[];

  constructor(items: Map<string, RollingCreditMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCreditMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCreditMilestone): void {
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

  list(): RollingCreditMilestone[] {
    const out: RollingCreditMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCreditMilestoneStore(): RollingCreditMilestoneStore {
  return new MemoryRollingCreditMilestoneStore(new Map<string, RollingCreditMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCreditMilestoneStore implements RollingCreditMilestoneStore {
  inner: RollingCreditMilestoneStore;
  cache: cache.TtlCache<RollingCreditMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCreditMilestoneStore,
    cacheValue: cache.TtlCache<RollingCreditMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCreditMilestone | undefined {
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

  save(item: RollingCreditMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCreditMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRollingCreditMilestoneStore(inner: RollingCreditMilestoneStore, ttl: number, clockValue: clock.Clock): RollingCreditMilestoneStore {
  return new CachedRollingCreditMilestoneStore(
    inner,
    cache.newTtlCache<RollingCreditMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling credit milestones. Empty fields match all. */
export class RollingCreditMilestoneQuery {
  region: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRetries: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCreditMilestone): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCreditMilestone[]): RollingCreditMilestone[] {
    const matched = collections.filter(items, (candidate: RollingCreditMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCreditMilestones(store: RollingCreditMilestoneStore, query: RollingCreditMilestoneQuery): RollingCreditMilestone[] {
  return query.apply(store.list());
}
