import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortMilestone } from "./cohort-milestone.js";

/** Keeps cohort milestones by code. */
export interface CohortMilestoneStore {
  find(code: string): CohortMilestone | undefined;
  save(item: CohortMilestone): void;
  remove(code: string): boolean;
  list(): CohortMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortMilestoneStore implements CohortMilestoneStore {
  items: Map<string, CohortMilestone>;
  order: string[];

  constructor(items: Map<string, CohortMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortMilestone): void {
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

  list(): CohortMilestone[] {
    const out: CohortMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortMilestoneStore(): CohortMilestoneStore {
  return new MemoryCohortMilestoneStore(new Map<string, CohortMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortMilestoneStore implements CohortMilestoneStore {
  inner: CohortMilestoneStore;
  cache: cache.TtlCache<CohortMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortMilestoneStore,
    cacheValue: cache.TtlCache<CohortMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortMilestone | undefined {
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

  save(item: CohortMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortMilestone[] {
    return this.inner.list();
  }
}

export function newCachedCohortMilestoneStore(inner: CohortMilestoneStore, ttl: number, clockValue: clock.Clock): CohortMilestoneStore {
  return new CachedCohortMilestoneStore(inner, cache.newTtlCache<CohortMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects cohort milestones. Empty fields match all. */
export class CohortMilestoneQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortMilestone[]): CohortMilestone[] {
    const matched = collections.filter(items, (candidate: CohortMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortMilestones(store: CohortMilestoneStore, query: CohortMilestoneQuery): CohortMilestone[] {
  return query.apply(store.list());
}
