import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { EnrollmentMilestone } from "./enrollment-milestone.js";

/** Keeps enrollment milestones by code. */
export interface EnrollmentMilestoneStore {
  find(code: string): EnrollmentMilestone | undefined;
  save(item: EnrollmentMilestone): void;
  remove(code: string): boolean;
  list(): EnrollmentMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryEnrollmentMilestoneStore implements EnrollmentMilestoneStore {
  items: Map<string, EnrollmentMilestone>;
  order: string[];

  constructor(items: Map<string, EnrollmentMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): EnrollmentMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: EnrollmentMilestone): void {
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

  list(): EnrollmentMilestone[] {
    const out: EnrollmentMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryEnrollmentMilestoneStore(): EnrollmentMilestoneStore {
  return new MemoryEnrollmentMilestoneStore(new Map<string, EnrollmentMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedEnrollmentMilestoneStore implements EnrollmentMilestoneStore {
  inner: EnrollmentMilestoneStore;
  cache: cache.TtlCache<EnrollmentMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: EnrollmentMilestoneStore,
    cacheValue: cache.TtlCache<EnrollmentMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): EnrollmentMilestone | undefined {
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

  save(item: EnrollmentMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): EnrollmentMilestone[] {
    return this.inner.list();
  }
}

export function newCachedEnrollmentMilestoneStore(inner: EnrollmentMilestoneStore, ttl: number, clockValue: clock.Clock): EnrollmentMilestoneStore {
  return new CachedEnrollmentMilestoneStore(inner, cache.newTtlCache<EnrollmentMilestone>(128, ttl, clockValue), 0, 0);
}

/** Selects enrollment milestones. Empty fields match all. */
export class EnrollmentMilestoneQuery {
  label: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minFloorValue: number, statuses: string[], limit: number) {
    this.label = label;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: EnrollmentMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: EnrollmentMilestone[]): EnrollmentMilestone[] {
    const matched = collections.filter(items, (candidate: EnrollmentMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findEnrollmentMilestones(store: EnrollmentMilestoneStore, query: EnrollmentMilestoneQuery): EnrollmentMilestone[] {
  return query.apply(store.list());
}
