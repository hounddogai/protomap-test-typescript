import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BadgeMilestone } from "./badge-milestone.js";

/** Keeps badge milestones by code. */
export interface BadgeMilestoneStore {
  find(code: string): BadgeMilestone | undefined;
  save(item: BadgeMilestone): void;
  remove(code: string): boolean;
  list(): BadgeMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBadgeMilestoneStore implements BadgeMilestoneStore {
  items: Map<string, BadgeMilestone>;
  order: string[];

  constructor(items: Map<string, BadgeMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BadgeMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BadgeMilestone): void {
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

  list(): BadgeMilestone[] {
    const out: BadgeMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBadgeMilestoneStore(): BadgeMilestoneStore {
  return new MemoryBadgeMilestoneStore(new Map<string, BadgeMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBadgeMilestoneStore implements BadgeMilestoneStore {
  inner: BadgeMilestoneStore;
  cache: cache.TtlCache<BadgeMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: BadgeMilestoneStore,
    cacheValue: cache.TtlCache<BadgeMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BadgeMilestone | undefined {
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

  save(item: BadgeMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BadgeMilestone[] {
    return this.inner.list();
  }
}

export function newCachedBadgeMilestoneStore(inner: BadgeMilestoneStore, ttl: number, clockValue: clock.Clock): BadgeMilestoneStore {
  return new CachedBadgeMilestoneStore(inner, cache.newTtlCache<BadgeMilestone>(128, ttl, clockValue), 0, 0);
}

/** Selects badge milestones. Empty fields match all. */
export class BadgeMilestoneQuery {
  region: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMinimum: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BadgeMilestone): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BadgeMilestone[]): BadgeMilestone[] {
    const matched = collections.filter(items, (candidate: BadgeMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBadgeMilestones(store: BadgeMilestoneStore, query: BadgeMilestoneQuery): BadgeMilestone[] {
  return query.apply(store.list());
}
