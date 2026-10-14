import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSlaMilestone } from "./global-sla-milestone.js";

/** Keeps global sla milestones by code. */
export interface GlobalSlaMilestoneStore {
  find(code: string): GlobalSlaMilestone | undefined;
  save(item: GlobalSlaMilestone): void;
  remove(code: string): boolean;
  list(): GlobalSlaMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSlaMilestoneStore implements GlobalSlaMilestoneStore {
  items: Map<string, GlobalSlaMilestone>;
  order: string[];

  constructor(items: Map<string, GlobalSlaMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSlaMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSlaMilestone): void {
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

  list(): GlobalSlaMilestone[] {
    const out: GlobalSlaMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSlaMilestoneStore(): GlobalSlaMilestoneStore {
  return new MemoryGlobalSlaMilestoneStore(new Map<string, GlobalSlaMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSlaMilestoneStore implements GlobalSlaMilestoneStore {
  inner: GlobalSlaMilestoneStore;
  cache: cache.TtlCache<GlobalSlaMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSlaMilestoneStore,
    cacheValue: cache.TtlCache<GlobalSlaMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSlaMilestone | undefined {
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

  save(item: GlobalSlaMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSlaMilestone[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSlaMilestoneStore(inner: GlobalSlaMilestoneStore, ttl: number, clockValue: clock.Clock): GlobalSlaMilestoneStore {
  return new CachedGlobalSlaMilestoneStore(inner, cache.newTtlCache<GlobalSlaMilestone>(1024, ttl, clockValue), 0, 0);
}

/** Selects global sla milestones. Empty fields match all. */
export class GlobalSlaMilestoneQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSlaMilestone): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSlaMilestone[]): GlobalSlaMilestone[] {
    const matched = collections.filter(items, (candidate: GlobalSlaMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSlaMilestones(store: GlobalSlaMilestoneStore, query: GlobalSlaMilestoneQuery): GlobalSlaMilestone[] {
  return query.apply(store.list());
}
