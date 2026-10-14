import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementMilestone } from "./placement-milestone.js";

/** Keeps placement milestones by code. */
export interface PlacementMilestoneStore {
  find(code: string): PlacementMilestone | undefined;
  save(item: PlacementMilestone): void;
  remove(code: string): boolean;
  list(): PlacementMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementMilestoneStore implements PlacementMilestoneStore {
  items: Map<string, PlacementMilestone>;
  order: string[];

  constructor(items: Map<string, PlacementMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementMilestone): void {
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

  list(): PlacementMilestone[] {
    const out: PlacementMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementMilestoneStore(): PlacementMilestoneStore {
  return new MemoryPlacementMilestoneStore(new Map<string, PlacementMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementMilestoneStore implements PlacementMilestoneStore {
  inner: PlacementMilestoneStore;
  cache: cache.TtlCache<PlacementMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementMilestoneStore,
    cacheValue: cache.TtlCache<PlacementMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementMilestone | undefined {
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

  save(item: PlacementMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementMilestone[] {
    return this.inner.list();
  }
}

export function newCachedPlacementMilestoneStore(inner: PlacementMilestoneStore, ttl: number, clockValue: clock.Clock): PlacementMilestoneStore {
  return new CachedPlacementMilestoneStore(inner, cache.newTtlCache<PlacementMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects placement milestones. Empty fields match all. */
export class PlacementMilestoneQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementMilestone[]): PlacementMilestone[] {
    const matched = collections.filter(items, (candidate: PlacementMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementMilestones(store: PlacementMilestoneStore, query: PlacementMilestoneQuery): PlacementMilestone[] {
  return query.apply(store.list());
}
