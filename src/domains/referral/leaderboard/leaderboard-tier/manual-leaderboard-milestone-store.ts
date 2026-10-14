import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

/** Keeps manual leaderboard milestones by code. */
export interface ManualLeaderboardMilestoneStore {
  find(code: string): ManualLeaderboardMilestone | undefined;
  save(item: ManualLeaderboardMilestone): void;
  remove(code: string): boolean;
  list(): ManualLeaderboardMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualLeaderboardMilestoneStore implements ManualLeaderboardMilestoneStore {
  items: Map<string, ManualLeaderboardMilestone>;
  order: string[];

  constructor(items: Map<string, ManualLeaderboardMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualLeaderboardMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualLeaderboardMilestone): void {
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

  list(): ManualLeaderboardMilestone[] {
    const out: ManualLeaderboardMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualLeaderboardMilestoneStore(): ManualLeaderboardMilestoneStore {
  return new MemoryManualLeaderboardMilestoneStore(new Map<string, ManualLeaderboardMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualLeaderboardMilestoneStore implements ManualLeaderboardMilestoneStore {
  inner: ManualLeaderboardMilestoneStore;
  cache: cache.TtlCache<ManualLeaderboardMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualLeaderboardMilestoneStore,
    cacheValue: cache.TtlCache<ManualLeaderboardMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualLeaderboardMilestone | undefined {
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

  save(item: ManualLeaderboardMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualLeaderboardMilestone[] {
    return this.inner.list();
  }
}

export function newCachedManualLeaderboardMilestoneStore(inner: ManualLeaderboardMilestoneStore, ttl: number, clockValue: clock.Clock): ManualLeaderboardMilestoneStore {
  return new CachedManualLeaderboardMilestoneStore(
    inner,
    cache.newTtlCache<ManualLeaderboardMilestone>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual leaderboard milestones. Empty fields match all. */
export class ManualLeaderboardMilestoneQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualLeaderboardMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualLeaderboardMilestone[]): ManualLeaderboardMilestone[] {
    const matched = collections.filter(items, (candidate: ManualLeaderboardMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualLeaderboardMilestones(store: ManualLeaderboardMilestoneStore, query: ManualLeaderboardMilestoneQuery): ManualLeaderboardMilestone[] {
  return query.apply(store.list());
}
