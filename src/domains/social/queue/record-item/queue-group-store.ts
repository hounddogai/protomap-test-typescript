import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueGroup } from "./queue-group.js";

/** Keeps queue groups by code. */
export interface QueueGroupStore {
  find(code: string): QueueGroup | undefined;
  save(item: QueueGroup): void;
  remove(code: string): boolean;
  list(): QueueGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueGroupStore implements QueueGroupStore {
  items: Map<string, QueueGroup>;
  order: string[];

  constructor(items: Map<string, QueueGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueGroup): void {
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

  list(): QueueGroup[] {
    const out: QueueGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueGroupStore(): QueueGroupStore {
  return new MemoryQueueGroupStore(new Map<string, QueueGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueGroupStore implements QueueGroupStore {
  inner: QueueGroupStore;
  cache: cache.TtlCache<QueueGroup>;
  hits: number;
  misses: number;

  constructor(inner: QueueGroupStore, cacheValue: cache.TtlCache<QueueGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueGroup | undefined {
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

  save(item: QueueGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueGroup[] {
    return this.inner.list();
  }
}

export function newCachedQueueGroupStore(inner: QueueGroupStore, ttl: number, clockValue: clock.Clock): QueueGroupStore {
  return new CachedQueueGroupStore(inner, cache.newTtlCache<QueueGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue groups. Empty fields match all. */
export class QueueGroupQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueGroup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueGroup[]): QueueGroup[] {
    const matched = collections.filter(items, (candidate: QueueGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueGroups(store: QueueGroupStore, query: QueueGroupQuery): QueueGroup[] {
  return query.apply(store.list());
}
