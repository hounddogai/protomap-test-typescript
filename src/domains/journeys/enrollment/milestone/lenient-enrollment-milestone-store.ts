import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

/** Keeps lenient enrollment milestones by code. */
export interface LenientEnrollmentMilestoneStore {
  find(code: string): LenientEnrollmentMilestone | undefined;
  save(item: LenientEnrollmentMilestone): void;
  remove(code: string): boolean;
  list(): LenientEnrollmentMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientEnrollmentMilestoneStore implements LenientEnrollmentMilestoneStore {
  items: Map<string, LenientEnrollmentMilestone>;
  order: string[];

  constructor(items: Map<string, LenientEnrollmentMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientEnrollmentMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientEnrollmentMilestone): void {
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

  list(): LenientEnrollmentMilestone[] {
    const out: LenientEnrollmentMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientEnrollmentMilestoneStore(): LenientEnrollmentMilestoneStore {
  return new MemoryLenientEnrollmentMilestoneStore(new Map<string, LenientEnrollmentMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientEnrollmentMilestoneStore implements LenientEnrollmentMilestoneStore {
  inner: LenientEnrollmentMilestoneStore;
  cache: cache.TtlCache<LenientEnrollmentMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientEnrollmentMilestoneStore,
    cacheValue: cache.TtlCache<LenientEnrollmentMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientEnrollmentMilestone | undefined {
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

  save(item: LenientEnrollmentMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientEnrollmentMilestone[] {
    return this.inner.list();
  }
}

export function newCachedLenientEnrollmentMilestoneStore(inner: LenientEnrollmentMilestoneStore, ttl: number, clockValue: clock.Clock): LenientEnrollmentMilestoneStore {
  return new CachedLenientEnrollmentMilestoneStore(
    inner,
    cache.newTtlCache<LenientEnrollmentMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient enrollment milestones. Empty fields match all. */
export class LenientEnrollmentMilestoneQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientEnrollmentMilestone): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientEnrollmentMilestone[]): LenientEnrollmentMilestone[] {
    const matched = collections.filter(items, (candidate: LenientEnrollmentMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientEnrollmentMilestones(store: LenientEnrollmentMilestoneStore, query: LenientEnrollmentMilestoneQuery): LenientEnrollmentMilestone[] {
  return query.apply(store.list());
}
