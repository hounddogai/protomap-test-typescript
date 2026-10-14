import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPreferenceMilestone } from "./strict-preference-milestone.js";

/** Keeps strict preference milestones by code. */
export interface StrictPreferenceMilestoneStore {
  find(code: string): StrictPreferenceMilestone | undefined;
  save(item: StrictPreferenceMilestone): void;
  remove(code: string): boolean;
  list(): StrictPreferenceMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPreferenceMilestoneStore implements StrictPreferenceMilestoneStore {
  items: Map<string, StrictPreferenceMilestone>;
  order: string[];

  constructor(items: Map<string, StrictPreferenceMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPreferenceMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPreferenceMilestone): void {
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

  list(): StrictPreferenceMilestone[] {
    const out: StrictPreferenceMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPreferenceMilestoneStore(): StrictPreferenceMilestoneStore {
  return new MemoryStrictPreferenceMilestoneStore(new Map<string, StrictPreferenceMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPreferenceMilestoneStore implements StrictPreferenceMilestoneStore {
  inner: StrictPreferenceMilestoneStore;
  cache: cache.TtlCache<StrictPreferenceMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPreferenceMilestoneStore,
    cacheValue: cache.TtlCache<StrictPreferenceMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPreferenceMilestone | undefined {
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

  save(item: StrictPreferenceMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPreferenceMilestone[] {
    return this.inner.list();
  }
}

export function newCachedStrictPreferenceMilestoneStore(inner: StrictPreferenceMilestoneStore, ttl: number, clockValue: clock.Clock): StrictPreferenceMilestoneStore {
  return new CachedStrictPreferenceMilestoneStore(
    inner,
    cache.newTtlCache<StrictPreferenceMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict preference milestones. Empty fields match all. */
export class StrictPreferenceMilestoneQuery {
  unit: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minConversionRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPreferenceMilestone): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPreferenceMilestone[]): StrictPreferenceMilestone[] {
    const matched = collections.filter(items, (candidate: StrictPreferenceMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPreferenceMilestones(store: StrictPreferenceMilestoneStore, query: StrictPreferenceMilestoneQuery): StrictPreferenceMilestone[] {
  return query.apply(store.list());
}
