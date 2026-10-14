import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitMilestone } from "./wait-milestone.js";

/** Keeps wait milestones by code. */
export interface WaitMilestoneStore {
  find(code: string): WaitMilestone | undefined;
  save(item: WaitMilestone): void;
  remove(code: string): boolean;
  list(): WaitMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitMilestoneStore implements WaitMilestoneStore {
  items: Map<string, WaitMilestone>;
  order: string[];

  constructor(items: Map<string, WaitMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitMilestone): void {
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

  list(): WaitMilestone[] {
    const out: WaitMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitMilestoneStore(): WaitMilestoneStore {
  return new MemoryWaitMilestoneStore(new Map<string, WaitMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitMilestoneStore implements WaitMilestoneStore {
  inner: WaitMilestoneStore;
  cache: cache.TtlCache<WaitMilestone>;
  hits: number;
  misses: number;

  constructor(inner: WaitMilestoneStore, cacheValue: cache.TtlCache<WaitMilestone>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitMilestone | undefined {
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

  save(item: WaitMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitMilestone[] {
    return this.inner.list();
  }
}

export function newCachedWaitMilestoneStore(inner: WaitMilestoneStore, ttl: number, clockValue: clock.Clock): WaitMilestoneStore {
  return new CachedWaitMilestoneStore(inner, cache.newTtlCache<WaitMilestone>(256, ttl, clockValue), 0, 0);
}

/** Selects wait milestones. Empty fields match all. */
export class WaitMilestoneQuery {
  locale: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBid: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitMilestone): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitMilestone[]): WaitMilestone[] {
    const matched = collections.filter(items, (candidate: WaitMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitMilestones(store: WaitMilestoneStore, query: WaitMilestoneQuery): WaitMilestone[] {
  return query.apply(store.list());
}
