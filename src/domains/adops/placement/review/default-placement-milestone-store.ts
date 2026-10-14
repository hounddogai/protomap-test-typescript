import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPlacementMilestone } from "./default-placement-milestone.js";

/** Keeps default placement milestones by code. */
export interface DefaultPlacementMilestoneStore {
  find(code: string): DefaultPlacementMilestone | undefined;
  save(item: DefaultPlacementMilestone): void;
  remove(code: string): boolean;
  list(): DefaultPlacementMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPlacementMilestoneStore implements DefaultPlacementMilestoneStore {
  items: Map<string, DefaultPlacementMilestone>;
  order: string[];

  constructor(items: Map<string, DefaultPlacementMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPlacementMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPlacementMilestone): void {
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

  list(): DefaultPlacementMilestone[] {
    const out: DefaultPlacementMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPlacementMilestoneStore(): DefaultPlacementMilestoneStore {
  return new MemoryDefaultPlacementMilestoneStore(new Map<string, DefaultPlacementMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPlacementMilestoneStore implements DefaultPlacementMilestoneStore {
  inner: DefaultPlacementMilestoneStore;
  cache: cache.TtlCache<DefaultPlacementMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPlacementMilestoneStore,
    cacheValue: cache.TtlCache<DefaultPlacementMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPlacementMilestone | undefined {
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

  save(item: DefaultPlacementMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPlacementMilestone[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPlacementMilestoneStore(inner: DefaultPlacementMilestoneStore, ttl: number, clockValue: clock.Clock): DefaultPlacementMilestoneStore {
  return new CachedDefaultPlacementMilestoneStore(
    inner,
    cache.newTtlCache<DefaultPlacementMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default placement milestones. Empty fields match all. */
export class DefaultPlacementMilestoneQuery {
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

  matches(item: DefaultPlacementMilestone): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPlacementMilestone[]): DefaultPlacementMilestone[] {
    const matched = collections.filter(items, (candidate: DefaultPlacementMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPlacementMilestones(store: DefaultPlacementMilestoneStore, query: DefaultPlacementMilestoneQuery): DefaultPlacementMilestone[] {
  return query.apply(store.list());
}
