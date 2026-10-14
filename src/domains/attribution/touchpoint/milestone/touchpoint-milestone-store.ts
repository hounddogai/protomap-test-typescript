import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointMilestone } from "./touchpoint-milestone.js";

/** Keeps touchpoint milestones by code. */
export interface TouchpointMilestoneStore {
  find(code: string): TouchpointMilestone | undefined;
  save(item: TouchpointMilestone): void;
  remove(code: string): boolean;
  list(): TouchpointMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointMilestoneStore implements TouchpointMilestoneStore {
  items: Map<string, TouchpointMilestone>;
  order: string[];

  constructor(items: Map<string, TouchpointMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointMilestone): void {
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

  list(): TouchpointMilestone[] {
    const out: TouchpointMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointMilestoneStore(): TouchpointMilestoneStore {
  return new MemoryTouchpointMilestoneStore(new Map<string, TouchpointMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointMilestoneStore implements TouchpointMilestoneStore {
  inner: TouchpointMilestoneStore;
  cache: cache.TtlCache<TouchpointMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointMilestoneStore,
    cacheValue: cache.TtlCache<TouchpointMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointMilestone | undefined {
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

  save(item: TouchpointMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointMilestone[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointMilestoneStore(inner: TouchpointMilestoneStore, ttl: number, clockValue: clock.Clock): TouchpointMilestoneStore {
  return new CachedTouchpointMilestoneStore(inner, cache.newTtlCache<TouchpointMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint milestones. Empty fields match all. */
export class TouchpointMilestoneQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointMilestone[]): TouchpointMilestone[] {
    const matched = collections.filter(items, (candidate: TouchpointMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointMilestones(store: TouchpointMilestoneStore, query: TouchpointMilestoneQuery): TouchpointMilestone[] {
  return query.apply(store.list());
}
