import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

/** Keeps scheduled warmup milestones by code. */
export interface ScheduledWarmupMilestoneStore {
  find(code: string): ScheduledWarmupMilestone | undefined;
  save(item: ScheduledWarmupMilestone): void;
  remove(code: string): boolean;
  list(): ScheduledWarmupMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWarmupMilestoneStore implements ScheduledWarmupMilestoneStore {
  items: Map<string, ScheduledWarmupMilestone>;
  order: string[];

  constructor(items: Map<string, ScheduledWarmupMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWarmupMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWarmupMilestone): void {
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

  list(): ScheduledWarmupMilestone[] {
    const out: ScheduledWarmupMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWarmupMilestoneStore(): ScheduledWarmupMilestoneStore {
  return new MemoryScheduledWarmupMilestoneStore(new Map<string, ScheduledWarmupMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWarmupMilestoneStore implements ScheduledWarmupMilestoneStore {
  inner: ScheduledWarmupMilestoneStore;
  cache: cache.TtlCache<ScheduledWarmupMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWarmupMilestoneStore,
    cacheValue: cache.TtlCache<ScheduledWarmupMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWarmupMilestone | undefined {
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

  save(item: ScheduledWarmupMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWarmupMilestone[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWarmupMilestoneStore(inner: ScheduledWarmupMilestoneStore, ttl: number, clockValue: clock.Clock): ScheduledWarmupMilestoneStore {
  return new CachedScheduledWarmupMilestoneStore(
    inner,
    cache.newTtlCache<ScheduledWarmupMilestone>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled warmup milestones. Empty fields match all. */
export class ScheduledWarmupMilestoneQuery {
  label: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWarmupMilestone): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWarmupMilestone[]): ScheduledWarmupMilestone[] {
    const matched = collections.filter(items, (candidate: ScheduledWarmupMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWarmupMilestones(store: ScheduledWarmupMilestoneStore, query: ScheduledWarmupMilestoneQuery): ScheduledWarmupMilestone[] {
  return query.apply(store.list());
}
