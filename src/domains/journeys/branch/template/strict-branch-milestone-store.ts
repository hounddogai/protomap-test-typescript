import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictBranchMilestone } from "./strict-branch-milestone.js";

/** Keeps strict branch milestones by code. */
export interface StrictBranchMilestoneStore {
  find(code: string): StrictBranchMilestone | undefined;
  save(item: StrictBranchMilestone): void;
  remove(code: string): boolean;
  list(): StrictBranchMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictBranchMilestoneStore implements StrictBranchMilestoneStore {
  items: Map<string, StrictBranchMilestone>;
  order: string[];

  constructor(items: Map<string, StrictBranchMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictBranchMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictBranchMilestone): void {
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

  list(): StrictBranchMilestone[] {
    const out: StrictBranchMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictBranchMilestoneStore(): StrictBranchMilestoneStore {
  return new MemoryStrictBranchMilestoneStore(new Map<string, StrictBranchMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictBranchMilestoneStore implements StrictBranchMilestoneStore {
  inner: StrictBranchMilestoneStore;
  cache: cache.TtlCache<StrictBranchMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictBranchMilestoneStore,
    cacheValue: cache.TtlCache<StrictBranchMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictBranchMilestone | undefined {
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

  save(item: StrictBranchMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictBranchMilestone[] {
    return this.inner.list();
  }
}

export function newCachedStrictBranchMilestoneStore(inner: StrictBranchMilestoneStore, ttl: number, clockValue: clock.Clock): StrictBranchMilestoneStore {
  return new CachedStrictBranchMilestoneStore(
    inner,
    cache.newTtlCache<StrictBranchMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict branch milestones. Empty fields match all. */
export class StrictBranchMilestoneQuery {
  segment: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBid: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictBranchMilestone): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictBranchMilestone[]): StrictBranchMilestone[] {
    const matched = collections.filter(items, (candidate: StrictBranchMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictBranchMilestones(store: StrictBranchMilestoneStore, query: StrictBranchMilestoneQuery): StrictBranchMilestone[] {
  return query.apply(store.list());
}
