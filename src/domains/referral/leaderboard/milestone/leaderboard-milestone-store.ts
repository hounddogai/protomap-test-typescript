import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardMilestone } from "./leaderboard-milestone.js";

/** Keeps leaderboard milestones by code. */
export interface LeaderboardMilestoneStore {
  find(code: string): LeaderboardMilestone | undefined;
  save(item: LeaderboardMilestone): void;
  remove(code: string): boolean;
  list(): LeaderboardMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardMilestoneStore implements LeaderboardMilestoneStore {
  items: Map<string, LeaderboardMilestone>;
  order: string[];

  constructor(items: Map<string, LeaderboardMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardMilestone): void {
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

  list(): LeaderboardMilestone[] {
    const out: LeaderboardMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardMilestoneStore(): LeaderboardMilestoneStore {
  return new MemoryLeaderboardMilestoneStore(new Map<string, LeaderboardMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardMilestoneStore implements LeaderboardMilestoneStore {
  inner: LeaderboardMilestoneStore;
  cache: cache.TtlCache<LeaderboardMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardMilestoneStore,
    cacheValue: cache.TtlCache<LeaderboardMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardMilestone | undefined {
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

  save(item: LeaderboardMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardMilestoneStore(inner: LeaderboardMilestoneStore, ttl: number, clockValue: clock.Clock): LeaderboardMilestoneStore {
  return new CachedLeaderboardMilestoneStore(
    inner,
    cache.newTtlCache<LeaderboardMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects leaderboard milestones. Empty fields match all. */
export class LeaderboardMilestoneQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardMilestone[]): LeaderboardMilestone[] {
    const matched = collections.filter(items, (candidate: LeaderboardMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardMilestones(store: LeaderboardMilestoneStore, query: LeaderboardMilestoneQuery): LeaderboardMilestone[] {
  return query.apply(store.list());
}
