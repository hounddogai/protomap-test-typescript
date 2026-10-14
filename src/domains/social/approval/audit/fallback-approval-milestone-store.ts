import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackApprovalMilestone } from "./fallback-approval-milestone.js";

/** Keeps fallback approval milestones by code. */
export interface FallbackApprovalMilestoneStore {
  find(code: string): FallbackApprovalMilestone | undefined;
  save(item: FallbackApprovalMilestone): void;
  remove(code: string): boolean;
  list(): FallbackApprovalMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackApprovalMilestoneStore implements FallbackApprovalMilestoneStore {
  items: Map<string, FallbackApprovalMilestone>;
  order: string[];

  constructor(items: Map<string, FallbackApprovalMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackApprovalMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackApprovalMilestone): void {
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

  list(): FallbackApprovalMilestone[] {
    const out: FallbackApprovalMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackApprovalMilestoneStore(): FallbackApprovalMilestoneStore {
  return new MemoryFallbackApprovalMilestoneStore(new Map<string, FallbackApprovalMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackApprovalMilestoneStore implements FallbackApprovalMilestoneStore {
  inner: FallbackApprovalMilestoneStore;
  cache: cache.TtlCache<FallbackApprovalMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackApprovalMilestoneStore,
    cacheValue: cache.TtlCache<FallbackApprovalMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackApprovalMilestone | undefined {
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

  save(item: FallbackApprovalMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackApprovalMilestone[] {
    return this.inner.list();
  }
}

export function newCachedFallbackApprovalMilestoneStore(inner: FallbackApprovalMilestoneStore, ttl: number, clockValue: clock.Clock): FallbackApprovalMilestoneStore {
  return new CachedFallbackApprovalMilestoneStore(
    inner,
    cache.newTtlCache<FallbackApprovalMilestone>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback approval milestones. Empty fields match all. */
export class FallbackApprovalMilestoneQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackApprovalMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackApprovalMilestone[]): FallbackApprovalMilestone[] {
    const matched = collections.filter(items, (candidate: FallbackApprovalMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackApprovalMilestones(store: FallbackApprovalMilestoneStore, query: FallbackApprovalMilestoneQuery): FallbackApprovalMilestone[] {
  return query.apply(store.list());
}
