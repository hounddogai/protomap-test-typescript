import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCohortMilestone } from "./rolling-cohort-milestone.js";

/** Keeps rolling cohort milestones by code. */
export interface RollingCohortMilestoneStore {
  find(code: string): RollingCohortMilestone | undefined;
  save(item: RollingCohortMilestone): void;
  remove(code: string): boolean;
  list(): RollingCohortMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCohortMilestoneStore implements RollingCohortMilestoneStore {
  items: Map<string, RollingCohortMilestone>;
  order: string[];

  constructor(items: Map<string, RollingCohortMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCohortMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCohortMilestone): void {
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

  list(): RollingCohortMilestone[] {
    const out: RollingCohortMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCohortMilestoneStore(): RollingCohortMilestoneStore {
  return new MemoryRollingCohortMilestoneStore(new Map<string, RollingCohortMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCohortMilestoneStore implements RollingCohortMilestoneStore {
  inner: RollingCohortMilestoneStore;
  cache: cache.TtlCache<RollingCohortMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCohortMilestoneStore,
    cacheValue: cache.TtlCache<RollingCohortMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCohortMilestone | undefined {
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

  save(item: RollingCohortMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCohortMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRollingCohortMilestoneStore(inner: RollingCohortMilestoneStore, ttl: number, clockValue: clock.Clock): RollingCohortMilestoneStore {
  return new CachedRollingCohortMilestoneStore(
    inner,
    cache.newTtlCache<RollingCohortMilestone>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling cohort milestones. Empty fields match all. */
export class RollingCohortMilestoneQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCohortMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCohortMilestone[]): RollingCohortMilestone[] {
    const matched = collections.filter(items, (candidate: RollingCohortMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCohortMilestones(store: RollingCohortMilestoneStore, query: RollingCohortMilestoneQuery): RollingCohortMilestone[] {
  return query.apply(store.list());
}
