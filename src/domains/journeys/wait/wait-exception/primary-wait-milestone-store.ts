import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryWaitMilestone } from "./primary-wait-milestone.js";

/** Keeps primary wait milestones by code. */
export interface PrimaryWaitMilestoneStore {
  find(code: string): PrimaryWaitMilestone | undefined;
  save(item: PrimaryWaitMilestone): void;
  remove(code: string): boolean;
  list(): PrimaryWaitMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryWaitMilestoneStore implements PrimaryWaitMilestoneStore {
  items: Map<string, PrimaryWaitMilestone>;
  order: string[];

  constructor(items: Map<string, PrimaryWaitMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryWaitMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryWaitMilestone): void {
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

  list(): PrimaryWaitMilestone[] {
    const out: PrimaryWaitMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryWaitMilestoneStore(): PrimaryWaitMilestoneStore {
  return new MemoryPrimaryWaitMilestoneStore(new Map<string, PrimaryWaitMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryWaitMilestoneStore implements PrimaryWaitMilestoneStore {
  inner: PrimaryWaitMilestoneStore;
  cache: cache.TtlCache<PrimaryWaitMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryWaitMilestoneStore,
    cacheValue: cache.TtlCache<PrimaryWaitMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryWaitMilestone | undefined {
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

  save(item: PrimaryWaitMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryWaitMilestone[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryWaitMilestoneStore(inner: PrimaryWaitMilestoneStore, ttl: number, clockValue: clock.Clock): PrimaryWaitMilestoneStore {
  return new CachedPrimaryWaitMilestoneStore(
    inner,
    cache.newTtlCache<PrimaryWaitMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary wait milestones. Empty fields match all. */
export class PrimaryWaitMilestoneQuery {
  country: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minScore: number, statuses: string[], limit: number) {
    this.country = country;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryWaitMilestone): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryWaitMilestone[]): PrimaryWaitMilestone[] {
    const matched = collections.filter(items, (candidate: PrimaryWaitMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryWaitMilestones(store: PrimaryWaitMilestoneStore, query: PrimaryWaitMilestoneQuery): PrimaryWaitMilestone[] {
  return query.apply(store.list());
}
