import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingPathMilestone } from "./rolling-path-milestone.js";

/** Keeps rolling path milestones by code. */
export interface RollingPathMilestoneStore {
  find(code: string): RollingPathMilestone | undefined;
  save(item: RollingPathMilestone): void;
  remove(code: string): boolean;
  list(): RollingPathMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingPathMilestoneStore implements RollingPathMilestoneStore {
  items: Map<string, RollingPathMilestone>;
  order: string[];

  constructor(items: Map<string, RollingPathMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingPathMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingPathMilestone): void {
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

  list(): RollingPathMilestone[] {
    const out: RollingPathMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingPathMilestoneStore(): RollingPathMilestoneStore {
  return new MemoryRollingPathMilestoneStore(new Map<string, RollingPathMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingPathMilestoneStore implements RollingPathMilestoneStore {
  inner: RollingPathMilestoneStore;
  cache: cache.TtlCache<RollingPathMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingPathMilestoneStore,
    cacheValue: cache.TtlCache<RollingPathMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingPathMilestone | undefined {
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

  save(item: RollingPathMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingPathMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRollingPathMilestoneStore(inner: RollingPathMilestoneStore, ttl: number, clockValue: clock.Clock): RollingPathMilestoneStore {
  return new CachedRollingPathMilestoneStore(
    inner,
    cache.newTtlCache<RollingPathMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling path milestones. Empty fields match all. */
export class RollingPathMilestoneQuery {
  category: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minLimit: number, statuses: string[], limit: number) {
    this.category = category;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingPathMilestone): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingPathMilestone[]): RollingPathMilestone[] {
    const matched = collections.filter(items, (candidate: RollingPathMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingPathMilestones(store: RollingPathMilestoneStore, query: RollingPathMilestoneQuery): RollingPathMilestone[] {
  return query.apply(store.list());
}
