import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWindowMilestone } from "./tiered-window-milestone.js";

/** Keeps tiered window milestones by code. */
export interface TieredWindowMilestoneStore {
  find(code: string): TieredWindowMilestone | undefined;
  save(item: TieredWindowMilestone): void;
  remove(code: string): boolean;
  list(): TieredWindowMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWindowMilestoneStore implements TieredWindowMilestoneStore {
  items: Map<string, TieredWindowMilestone>;
  order: string[];

  constructor(items: Map<string, TieredWindowMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWindowMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWindowMilestone): void {
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

  list(): TieredWindowMilestone[] {
    const out: TieredWindowMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWindowMilestoneStore(): TieredWindowMilestoneStore {
  return new MemoryTieredWindowMilestoneStore(new Map<string, TieredWindowMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWindowMilestoneStore implements TieredWindowMilestoneStore {
  inner: TieredWindowMilestoneStore;
  cache: cache.TtlCache<TieredWindowMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWindowMilestoneStore,
    cacheValue: cache.TtlCache<TieredWindowMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWindowMilestone | undefined {
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

  save(item: TieredWindowMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWindowMilestone[] {
    return this.inner.list();
  }
}

export function newCachedTieredWindowMilestoneStore(inner: TieredWindowMilestoneStore, ttl: number, clockValue: clock.Clock): TieredWindowMilestoneStore {
  return new CachedTieredWindowMilestoneStore(
    inner,
    cache.newTtlCache<TieredWindowMilestone>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered window milestones. Empty fields match all. */
export class TieredWindowMilestoneQuery {
  channel: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minPriority: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWindowMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWindowMilestone[]): TieredWindowMilestone[] {
    const matched = collections.filter(items, (candidate: TieredWindowMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWindowMilestones(store: TieredWindowMilestoneStore, query: TieredWindowMilestoneQuery): TieredWindowMilestone[] {
  return query.apply(store.list());
}
