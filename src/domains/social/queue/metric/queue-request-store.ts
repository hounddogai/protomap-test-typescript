import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueRequest } from "./queue-request.js";

/** Keeps queue requests by code. */
export interface QueueRequestStore {
  find(code: string): QueueRequest | undefined;
  save(item: QueueRequest): void;
  remove(code: string): boolean;
  list(): QueueRequest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueRequestStore implements QueueRequestStore {
  items: Map<string, QueueRequest>;
  order: string[];

  constructor(items: Map<string, QueueRequest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueRequest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueRequest): void {
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

  list(): QueueRequest[] {
    const out: QueueRequest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueRequestStore(): QueueRequestStore {
  return new MemoryQueueRequestStore(new Map<string, QueueRequest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueRequestStore implements QueueRequestStore {
  inner: QueueRequestStore;
  cache: cache.TtlCache<QueueRequest>;
  hits: number;
  misses: number;

  constructor(inner: QueueRequestStore, cacheValue: cache.TtlCache<QueueRequest>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueRequest | undefined {
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

  save(item: QueueRequest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueRequest[] {
    return this.inner.list();
  }
}

export function newCachedQueueRequestStore(inner: QueueRequestStore, ttl: number, clockValue: clock.Clock): QueueRequestStore {
  return new CachedQueueRequestStore(inner, cache.newTtlCache<QueueRequest>(1024, ttl, clockValue), 0, 0);
}

/** Selects queue requests. Empty fields match all. */
export class QueueRequestQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueRequest): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueRequest[]): QueueRequest[] {
    const matched = collections.filter(items, (candidate: QueueRequest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueRequests(store: QueueRequestStore, query: QueueRequestQuery): QueueRequest[] {
  return query.apply(store.list());
}
