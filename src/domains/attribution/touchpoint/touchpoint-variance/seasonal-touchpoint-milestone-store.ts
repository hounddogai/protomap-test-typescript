import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalTouchpointMilestone } from "./seasonal-touchpoint-milestone.js";

/** Keeps seasonal touchpoint milestones by code. */
export interface SeasonalTouchpointMilestoneStore {
  find(code: string): SeasonalTouchpointMilestone | undefined;
  save(item: SeasonalTouchpointMilestone): void;
  remove(code: string): boolean;
  list(): SeasonalTouchpointMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalTouchpointMilestoneStore implements SeasonalTouchpointMilestoneStore {
  items: Map<string, SeasonalTouchpointMilestone>;
  order: string[];

  constructor(items: Map<string, SeasonalTouchpointMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalTouchpointMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalTouchpointMilestone): void {
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

  list(): SeasonalTouchpointMilestone[] {
    const out: SeasonalTouchpointMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalTouchpointMilestoneStore(): SeasonalTouchpointMilestoneStore {
  return new MemorySeasonalTouchpointMilestoneStore(new Map<string, SeasonalTouchpointMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalTouchpointMilestoneStore implements SeasonalTouchpointMilestoneStore {
  inner: SeasonalTouchpointMilestoneStore;
  cache: cache.TtlCache<SeasonalTouchpointMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalTouchpointMilestoneStore,
    cacheValue: cache.TtlCache<SeasonalTouchpointMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalTouchpointMilestone | undefined {
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

  save(item: SeasonalTouchpointMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalTouchpointMilestone[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalTouchpointMilestoneStore(inner: SeasonalTouchpointMilestoneStore, ttl: number, clockValue: clock.Clock): SeasonalTouchpointMilestoneStore {
  return new CachedSeasonalTouchpointMilestoneStore(
    inner,
    cache.newTtlCache<SeasonalTouchpointMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal touchpoint milestones. Empty fields match all. */
export class SeasonalTouchpointMilestoneQuery {
  source: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFloorValue: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalTouchpointMilestone): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalTouchpointMilestone[]): SeasonalTouchpointMilestone[] {
    const matched = collections.filter(items, (candidate: SeasonalTouchpointMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalTouchpointMilestones(store: SeasonalTouchpointMilestoneStore, query: SeasonalTouchpointMilestoneQuery): SeasonalTouchpointMilestone[] {
  return query.apply(store.list());
}
