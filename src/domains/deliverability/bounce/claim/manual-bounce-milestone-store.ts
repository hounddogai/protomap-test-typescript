import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualBounceMilestone } from "./manual-bounce-milestone.js";

/** Keeps manual bounce milestones by code. */
export interface ManualBounceMilestoneStore {
  find(code: string): ManualBounceMilestone | undefined;
  save(item: ManualBounceMilestone): void;
  remove(code: string): boolean;
  list(): ManualBounceMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualBounceMilestoneStore implements ManualBounceMilestoneStore {
  items: Map<string, ManualBounceMilestone>;
  order: string[];

  constructor(items: Map<string, ManualBounceMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualBounceMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualBounceMilestone): void {
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

  list(): ManualBounceMilestone[] {
    const out: ManualBounceMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualBounceMilestoneStore(): ManualBounceMilestoneStore {
  return new MemoryManualBounceMilestoneStore(new Map<string, ManualBounceMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualBounceMilestoneStore implements ManualBounceMilestoneStore {
  inner: ManualBounceMilestoneStore;
  cache: cache.TtlCache<ManualBounceMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualBounceMilestoneStore,
    cacheValue: cache.TtlCache<ManualBounceMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualBounceMilestone | undefined {
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

  save(item: ManualBounceMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualBounceMilestone[] {
    return this.inner.list();
  }
}

export function newCachedManualBounceMilestoneStore(inner: ManualBounceMilestoneStore, ttl: number, clockValue: clock.Clock): ManualBounceMilestoneStore {
  return new CachedManualBounceMilestoneStore(
    inner,
    cache.newTtlCache<ManualBounceMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual bounce milestones. Empty fields match all. */
export class ManualBounceMilestoneQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualBounceMilestone): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualBounceMilestone[]): ManualBounceMilestone[] {
    const matched = collections.filter(items, (candidate: ManualBounceMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualBounceMilestones(store: ManualBounceMilestoneStore, query: ManualBounceMilestoneQuery): ManualBounceMilestone[] {
  return query.apply(store.list());
}
