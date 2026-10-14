import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchMilestone } from "./branch-milestone.js";

/** Keeps branch milestones by code. */
export interface BranchMilestoneStore {
  find(code: string): BranchMilestone | undefined;
  save(item: BranchMilestone): void;
  remove(code: string): boolean;
  list(): BranchMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchMilestoneStore implements BranchMilestoneStore {
  items: Map<string, BranchMilestone>;
  order: string[];

  constructor(items: Map<string, BranchMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchMilestone): void {
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

  list(): BranchMilestone[] {
    const out: BranchMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchMilestoneStore(): BranchMilestoneStore {
  return new MemoryBranchMilestoneStore(new Map<string, BranchMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchMilestoneStore implements BranchMilestoneStore {
  inner: BranchMilestoneStore;
  cache: cache.TtlCache<BranchMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchMilestoneStore,
    cacheValue: cache.TtlCache<BranchMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchMilestone | undefined {
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

  save(item: BranchMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchMilestone[] {
    return this.inner.list();
  }
}

export function newCachedBranchMilestoneStore(inner: BranchMilestoneStore, ttl: number, clockValue: clock.Clock): BranchMilestoneStore {
  return new CachedBranchMilestoneStore(inner, cache.newTtlCache<BranchMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects branch milestones. Empty fields match all. */
export class BranchMilestoneQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchMilestone): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchMilestone[]): BranchMilestone[] {
    const matched = collections.filter(items, (candidate: BranchMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchMilestones(store: BranchMilestoneStore, query: BranchMilestoneQuery): BranchMilestone[] {
  return query.apply(store.list());
}
