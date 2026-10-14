import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingLevelMilestone } from "./pending-level-milestone.js";

/** Keeps pending level milestones by code. */
export interface PendingLevelMilestoneStore {
  find(code: string): PendingLevelMilestone | undefined;
  save(item: PendingLevelMilestone): void;
  remove(code: string): boolean;
  list(): PendingLevelMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingLevelMilestoneStore implements PendingLevelMilestoneStore {
  items: Map<string, PendingLevelMilestone>;
  order: string[];

  constructor(items: Map<string, PendingLevelMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingLevelMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingLevelMilestone): void {
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

  list(): PendingLevelMilestone[] {
    const out: PendingLevelMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingLevelMilestoneStore(): PendingLevelMilestoneStore {
  return new MemoryPendingLevelMilestoneStore(new Map<string, PendingLevelMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingLevelMilestoneStore implements PendingLevelMilestoneStore {
  inner: PendingLevelMilestoneStore;
  cache: cache.TtlCache<PendingLevelMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingLevelMilestoneStore,
    cacheValue: cache.TtlCache<PendingLevelMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingLevelMilestone | undefined {
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

  save(item: PendingLevelMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingLevelMilestone[] {
    return this.inner.list();
  }
}

export function newCachedPendingLevelMilestoneStore(inner: PendingLevelMilestoneStore, ttl: number, clockValue: clock.Clock): PendingLevelMilestoneStore {
  return new CachedPendingLevelMilestoneStore(
    inner,
    cache.newTtlCache<PendingLevelMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending level milestones. Empty fields match all. */
export class PendingLevelMilestoneQuery {
  utmSource: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCeiling: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingLevelMilestone): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingLevelMilestone[]): PendingLevelMilestone[] {
    const matched = collections.filter(items, (candidate: PendingLevelMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingLevelMilestones(store: PendingLevelMilestoneStore, query: PendingLevelMilestoneQuery): PendingLevelMilestone[] {
  return query.apply(store.list());
}
