import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBranchMilestone } from "./rolling-branch-milestone.js";

/** Keeps rolling branch milestones by code. */
export interface RollingBranchMilestoneStore {
  find(code: string): RollingBranchMilestone | undefined;
  save(item: RollingBranchMilestone): void;
  remove(code: string): boolean;
  list(): RollingBranchMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBranchMilestoneStore implements RollingBranchMilestoneStore {
  items: Map<string, RollingBranchMilestone>;
  order: string[];

  constructor(items: Map<string, RollingBranchMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBranchMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBranchMilestone): void {
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

  list(): RollingBranchMilestone[] {
    const out: RollingBranchMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBranchMilestoneStore(): RollingBranchMilestoneStore {
  return new MemoryRollingBranchMilestoneStore(new Map<string, RollingBranchMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBranchMilestoneStore implements RollingBranchMilestoneStore {
  inner: RollingBranchMilestoneStore;
  cache: cache.TtlCache<RollingBranchMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBranchMilestoneStore,
    cacheValue: cache.TtlCache<RollingBranchMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBranchMilestone | undefined {
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

  save(item: RollingBranchMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBranchMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRollingBranchMilestoneStore(inner: RollingBranchMilestoneStore, ttl: number, clockValue: clock.Clock): RollingBranchMilestoneStore {
  return new CachedRollingBranchMilestoneStore(
    inner,
    cache.newTtlCache<RollingBranchMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling branch milestones. Empty fields match all. */
export class RollingBranchMilestoneQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBranchMilestone): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBranchMilestone[]): RollingBranchMilestone[] {
    const matched = collections.filter(items, (candidate: RollingBranchMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBranchMilestones(store: RollingBranchMilestoneStore, query: RollingBranchMilestoneQuery): RollingBranchMilestone[] {
  return query.apply(store.list());
}
