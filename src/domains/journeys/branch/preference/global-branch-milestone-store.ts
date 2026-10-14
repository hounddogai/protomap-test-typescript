import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalBranchMilestone } from "./global-branch-milestone.js";

/** Keeps global branch milestones by code. */
export interface GlobalBranchMilestoneStore {
  find(code: string): GlobalBranchMilestone | undefined;
  save(item: GlobalBranchMilestone): void;
  remove(code: string): boolean;
  list(): GlobalBranchMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalBranchMilestoneStore implements GlobalBranchMilestoneStore {
  items: Map<string, GlobalBranchMilestone>;
  order: string[];

  constructor(items: Map<string, GlobalBranchMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalBranchMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalBranchMilestone): void {
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

  list(): GlobalBranchMilestone[] {
    const out: GlobalBranchMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalBranchMilestoneStore(): GlobalBranchMilestoneStore {
  return new MemoryGlobalBranchMilestoneStore(new Map<string, GlobalBranchMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalBranchMilestoneStore implements GlobalBranchMilestoneStore {
  inner: GlobalBranchMilestoneStore;
  cache: cache.TtlCache<GlobalBranchMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalBranchMilestoneStore,
    cacheValue: cache.TtlCache<GlobalBranchMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalBranchMilestone | undefined {
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

  save(item: GlobalBranchMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalBranchMilestone[] {
    return this.inner.list();
  }
}

export function newCachedGlobalBranchMilestoneStore(inner: GlobalBranchMilestoneStore, ttl: number, clockValue: clock.Clock): GlobalBranchMilestoneStore {
  return new CachedGlobalBranchMilestoneStore(
    inner,
    cache.newTtlCache<GlobalBranchMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global branch milestones. Empty fields match all. */
export class GlobalBranchMilestoneQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalBranchMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalBranchMilestone[]): GlobalBranchMilestone[] {
    const matched = collections.filter(items, (candidate: GlobalBranchMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalBranchMilestones(store: GlobalBranchMilestoneStore, query: GlobalBranchMilestoneQuery): GlobalBranchMilestone[] {
  return query.apply(store.list());
}
