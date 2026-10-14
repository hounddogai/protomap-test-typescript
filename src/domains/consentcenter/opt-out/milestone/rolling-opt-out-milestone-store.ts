import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingOptOutMilestone } from "./rolling-opt-out-milestone.js";

/** Keeps rolling opt out milestones by code. */
export interface RollingOptOutMilestoneStore {
  find(code: string): RollingOptOutMilestone | undefined;
  save(item: RollingOptOutMilestone): void;
  remove(code: string): boolean;
  list(): RollingOptOutMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingOptOutMilestoneStore implements RollingOptOutMilestoneStore {
  items: Map<string, RollingOptOutMilestone>;
  order: string[];

  constructor(items: Map<string, RollingOptOutMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingOptOutMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingOptOutMilestone): void {
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

  list(): RollingOptOutMilestone[] {
    const out: RollingOptOutMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingOptOutMilestoneStore(): RollingOptOutMilestoneStore {
  return new MemoryRollingOptOutMilestoneStore(new Map<string, RollingOptOutMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingOptOutMilestoneStore implements RollingOptOutMilestoneStore {
  inner: RollingOptOutMilestoneStore;
  cache: cache.TtlCache<RollingOptOutMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingOptOutMilestoneStore,
    cacheValue: cache.TtlCache<RollingOptOutMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingOptOutMilestone | undefined {
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

  save(item: RollingOptOutMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingOptOutMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRollingOptOutMilestoneStore(inner: RollingOptOutMilestoneStore, ttl: number, clockValue: clock.Clock): RollingOptOutMilestoneStore {
  return new CachedRollingOptOutMilestoneStore(
    inner,
    cache.newTtlCache<RollingOptOutMilestone>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling opt out milestones. Empty fields match all. */
export class RollingOptOutMilestoneQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingOptOutMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingOptOutMilestone[]): RollingOptOutMilestone[] {
    const matched = collections.filter(items, (candidate: RollingOptOutMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingOptOutMilestones(store: RollingOptOutMilestoneStore, query: RollingOptOutMilestoneQuery): RollingOptOutMilestone[] {
  return query.apply(store.list());
}
