import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueMilestone } from "./queue-milestone.js";

/** Keeps queue milestones by code. */
export interface QueueMilestoneStore {
  find(code: string): QueueMilestone | undefined;
  save(item: QueueMilestone): void;
  remove(code: string): boolean;
  list(): QueueMilestone[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueMilestoneStore implements QueueMilestoneStore {
  items: Map<string, QueueMilestone>;
  order: string[];

  constructor(items: Map<string, QueueMilestone>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueMilestone | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueMilestone): void {
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

  list(): QueueMilestone[] {
    const out: QueueMilestone[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueMilestoneStore(): QueueMilestoneStore {
  return new MemoryQueueMilestoneStore(new Map<string, QueueMilestone>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueMilestoneStore implements QueueMilestoneStore {
  inner: QueueMilestoneStore;
  cache: cache.TtlCache<QueueMilestone>;
  hits: number;
  misses: number;

  constructor(
    inner: QueueMilestoneStore,
    cacheValue: cache.TtlCache<QueueMilestone>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueMilestone | undefined {
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

  save(item: QueueMilestone): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueMilestone[] {
    return this.inner.list();
  }
}

export function newCachedQueueMilestoneStore(inner: QueueMilestoneStore, ttl: number, clockValue: clock.Clock): QueueMilestoneStore {
  return new CachedQueueMilestoneStore(inner, cache.newTtlCache<QueueMilestone>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue milestones. Empty fields match all. */
export class QueueMilestoneQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueMilestone): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueMilestone[]): QueueMilestone[] {
    const matched = collections.filter(items, (candidate: QueueMilestone): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueMilestones(store: QueueMilestoneStore, query: QueueMilestoneQuery): QueueMilestone[] {
  return query.apply(store.list());
}
