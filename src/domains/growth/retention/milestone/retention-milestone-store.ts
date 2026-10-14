import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionMilestone } from "./retention-milestone.js";

/** Keeps retention milestones by code. */
export interface RetentionMilestoneStore {
  find(code: string): RetentionMilestone | undefined;
  save(item: RetentionMilestone): void;
  remove(code: string): boolean;
  list(): RetentionMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionMilestoneStore implements RetentionMilestoneStore {
  items: Map<string, RetentionMilestone>;
  order: string[];

  constructor(items: Map<string, RetentionMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionMilestone): void {
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

  list(): RetentionMilestone[] {
    const out: RetentionMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionMilestoneStore(): RetentionMilestoneStore {
  return new MemoryRetentionMilestoneStore(new Map<string, RetentionMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionMilestoneStore implements RetentionMilestoneStore {
  inner: RetentionMilestoneStore;
  cache: cache.TtlCache<RetentionMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionMilestoneStore,
    cacheValue: cache.TtlCache<RetentionMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionMilestone | undefined {
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

  save(item: RetentionMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionMilestone[] {
    return this.inner.list();
  }
}

export function newCachedRetentionMilestoneStore(inner: RetentionMilestoneStore, ttl: number, clockValue: clock.Clock): RetentionMilestoneStore {
  return new CachedRetentionMilestoneStore(inner, cache.newTtlCache<RetentionMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects retention milestones. Empty fields match all. */
export class RetentionMilestoneQuery {
  segment: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAttempts: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionMilestone): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionMilestone[]): RetentionMilestone[] {
    const matched = collections.filter(items, (candidate: RetentionMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionMilestones(store: RetentionMilestoneStore, query: RetentionMilestoneQuery): RetentionMilestone[] {
  return query.apply(store.list());
}
