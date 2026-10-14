import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPreferenceMilestone } from "./default-preference-milestone.js";

/** Keeps default preference milestones by code. */
export interface DefaultPreferenceMilestoneStore {
  find(code: string): DefaultPreferenceMilestone | undefined;
  save(item: DefaultPreferenceMilestone): void;
  remove(code: string): boolean;
  list(): DefaultPreferenceMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPreferenceMilestoneStore implements DefaultPreferenceMilestoneStore {
  items: Map<string, DefaultPreferenceMilestone>;
  order: string[];

  constructor(items: Map<string, DefaultPreferenceMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPreferenceMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPreferenceMilestone): void {
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

  list(): DefaultPreferenceMilestone[] {
    const out: DefaultPreferenceMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPreferenceMilestoneStore(): DefaultPreferenceMilestoneStore {
  return new MemoryDefaultPreferenceMilestoneStore(new Map<string, DefaultPreferenceMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPreferenceMilestoneStore implements DefaultPreferenceMilestoneStore {
  inner: DefaultPreferenceMilestoneStore;
  cache: cache.TtlCache<DefaultPreferenceMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPreferenceMilestoneStore,
    cacheValue: cache.TtlCache<DefaultPreferenceMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPreferenceMilestone | undefined {
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

  save(item: DefaultPreferenceMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPreferenceMilestone[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPreferenceMilestoneStore(inner: DefaultPreferenceMilestoneStore, ttl: number, clockValue: clock.Clock): DefaultPreferenceMilestoneStore {
  return new CachedDefaultPreferenceMilestoneStore(
    inner,
    cache.newTtlCache<DefaultPreferenceMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default preference milestones. Empty fields match all. */
export class DefaultPreferenceMilestoneQuery {
  unit: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPreferenceMilestone): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPreferenceMilestone[]): DefaultPreferenceMilestone[] {
    const matched = collections.filter(items, (candidate: DefaultPreferenceMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPreferenceMilestones(store: DefaultPreferenceMilestoneStore, query: DefaultPreferenceMilestoneQuery): DefaultPreferenceMilestone[] {
  return query.apply(store.list());
}
