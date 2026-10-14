import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingWaitMilestone } from "./pending-wait-milestone.js";

/** Keeps pending wait milestones by code. */
export interface PendingWaitMilestoneStore {
  find(code: string): PendingWaitMilestone | undefined;
  save(item: PendingWaitMilestone): void;
  remove(code: string): boolean;
  list(): PendingWaitMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingWaitMilestoneStore implements PendingWaitMilestoneStore {
  items: Map<string, PendingWaitMilestone>;
  order: string[];

  constructor(items: Map<string, PendingWaitMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingWaitMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingWaitMilestone): void {
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

  list(): PendingWaitMilestone[] {
    const out: PendingWaitMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingWaitMilestoneStore(): PendingWaitMilestoneStore {
  return new MemoryPendingWaitMilestoneStore(new Map<string, PendingWaitMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingWaitMilestoneStore implements PendingWaitMilestoneStore {
  inner: PendingWaitMilestoneStore;
  cache: cache.TtlCache<PendingWaitMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingWaitMilestoneStore,
    cacheValue: cache.TtlCache<PendingWaitMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingWaitMilestone | undefined {
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

  save(item: PendingWaitMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingWaitMilestone[] {
    return this.inner.list();
  }
}

export function newCachedPendingWaitMilestoneStore(inner: PendingWaitMilestoneStore, ttl: number, clockValue: clock.Clock): PendingWaitMilestoneStore {
  return new CachedPendingWaitMilestoneStore(
    inner,
    cache.newTtlCache<PendingWaitMilestone>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending wait milestones. Empty fields match all. */
export class PendingWaitMilestoneQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingWaitMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingWaitMilestone[]): PendingWaitMilestone[] {
    const matched = collections.filter(items, (candidate: PendingWaitMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingWaitMilestones(store: PendingWaitMilestoneStore, query: PendingWaitMilestoneQuery): PendingWaitMilestone[] {
  return query.apply(store.list());
}
