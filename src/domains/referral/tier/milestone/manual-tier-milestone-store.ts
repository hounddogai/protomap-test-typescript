import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierMilestone } from "./manual-tier-milestone.js";

/** Keeps manual tier milestones by code. */
export interface ManualTierMilestoneStore {
  find(code: string): ManualTierMilestone | undefined;
  save(item: ManualTierMilestone): void;
  remove(code: string): boolean;
  list(): ManualTierMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierMilestoneStore implements ManualTierMilestoneStore {
  items: Map<string, ManualTierMilestone>;
  order: string[];

  constructor(items: Map<string, ManualTierMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierMilestone): void {
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

  list(): ManualTierMilestone[] {
    const out: ManualTierMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierMilestoneStore(): ManualTierMilestoneStore {
  return new MemoryManualTierMilestoneStore(new Map<string, ManualTierMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierMilestoneStore implements ManualTierMilestoneStore {
  inner: ManualTierMilestoneStore;
  cache: cache.TtlCache<ManualTierMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierMilestoneStore,
    cacheValue: cache.TtlCache<ManualTierMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierMilestone | undefined {
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

  save(item: ManualTierMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierMilestone[] {
    return this.inner.list();
  }
}

export function newCachedManualTierMilestoneStore(inner: ManualTierMilestoneStore, ttl: number, clockValue: clock.Clock): ManualTierMilestoneStore {
  return new CachedManualTierMilestoneStore(inner, cache.newTtlCache<ManualTierMilestone>(64, ttl, clockValue), 0, 0);
}

/** Selects manual tier milestones. Empty fields match all. */
export class ManualTierMilestoneQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierMilestone): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierMilestone[]): ManualTierMilestone[] {
    const matched = collections.filter(items, (candidate: ManualTierMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierMilestones(store: ManualTierMilestoneStore, query: ManualTierMilestoneQuery): ManualTierMilestone[] {
  return query.apply(store.list());
}
