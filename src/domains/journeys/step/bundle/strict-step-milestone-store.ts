import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictStepMilestone } from "./strict-step-milestone.js";

/** Keeps strict step milestones by code. */
export interface StrictStepMilestoneStore {
  find(code: string): StrictStepMilestone | undefined;
  save(item: StrictStepMilestone): void;
  remove(code: string): boolean;
  list(): StrictStepMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictStepMilestoneStore implements StrictStepMilestoneStore {
  items: Map<string, StrictStepMilestone>;
  order: string[];

  constructor(items: Map<string, StrictStepMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictStepMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictStepMilestone): void {
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

  list(): StrictStepMilestone[] {
    const out: StrictStepMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictStepMilestoneStore(): StrictStepMilestoneStore {
  return new MemoryStrictStepMilestoneStore(new Map<string, StrictStepMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictStepMilestoneStore implements StrictStepMilestoneStore {
  inner: StrictStepMilestoneStore;
  cache: cache.TtlCache<StrictStepMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictStepMilestoneStore,
    cacheValue: cache.TtlCache<StrictStepMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictStepMilestone | undefined {
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

  save(item: StrictStepMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictStepMilestone[] {
    return this.inner.list();
  }
}

export function newCachedStrictStepMilestoneStore(inner: StrictStepMilestoneStore, ttl: number, clockValue: clock.Clock): StrictStepMilestoneStore {
  return new CachedStrictStepMilestoneStore(inner, cache.newTtlCache<StrictStepMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects strict step milestones. Empty fields match all. */
export class StrictStepMilestoneQuery {
  name: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minGraceDays: number, statuses: string[], limit: number) {
    this.name = name;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictStepMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictStepMilestone[]): StrictStepMilestone[] {
    const matched = collections.filter(items, (candidate: StrictStepMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictStepMilestones(store: StrictStepMilestoneStore, query: StrictStepMilestoneQuery): StrictStepMilestone[] {
  return query.apply(store.list());
}
