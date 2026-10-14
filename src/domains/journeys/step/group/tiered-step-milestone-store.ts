import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredStepMilestone } from "./tiered-step-milestone.js";

/** Keeps tiered step milestones by code. */
export interface TieredStepMilestoneStore {
  find(code: string): TieredStepMilestone | undefined;
  save(item: TieredStepMilestone): void;
  remove(code: string): boolean;
  list(): TieredStepMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredStepMilestoneStore implements TieredStepMilestoneStore {
  items: Map<string, TieredStepMilestone>;
  order: string[];

  constructor(items: Map<string, TieredStepMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredStepMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredStepMilestone): void {
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

  list(): TieredStepMilestone[] {
    const out: TieredStepMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredStepMilestoneStore(): TieredStepMilestoneStore {
  return new MemoryTieredStepMilestoneStore(new Map<string, TieredStepMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredStepMilestoneStore implements TieredStepMilestoneStore {
  inner: TieredStepMilestoneStore;
  cache: cache.TtlCache<TieredStepMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredStepMilestoneStore,
    cacheValue: cache.TtlCache<TieredStepMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredStepMilestone | undefined {
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

  save(item: TieredStepMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredStepMilestone[] {
    return this.inner.list();
  }
}

export function newCachedTieredStepMilestoneStore(inner: TieredStepMilestoneStore, ttl: number, clockValue: clock.Clock): TieredStepMilestoneStore {
  return new CachedTieredStepMilestoneStore(inner, cache.newTtlCache<TieredStepMilestone>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered step milestones. Empty fields match all. */
export class TieredStepMilestoneQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredStepMilestone): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredStepMilestone[]): TieredStepMilestone[] {
    const matched = collections.filter(items, (candidate: TieredStepMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredStepMilestones(store: TieredStepMilestoneStore, query: TieredStepMilestoneQuery): TieredStepMilestone[] {
  return query.apply(store.list());
}
