import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueMapping } from "./queue-mapping.js";

/** Keeps queue mappings by code. */
export interface QueueMappingStore {
  find(code: string): QueueMapping | undefined;
  save(item: QueueMapping): void;
  remove(code: string): boolean;
  list(): QueueMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueMappingStore implements QueueMappingStore {
  items: Map<string, QueueMapping>;
  order: string[];

  constructor(items: Map<string, QueueMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueMapping): void {
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

  list(): QueueMapping[] {
    const out: QueueMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueMappingStore(): QueueMappingStore {
  return new MemoryQueueMappingStore(new Map<string, QueueMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueMappingStore implements QueueMappingStore {
  inner: QueueMappingStore;
  cache: cache.TtlCache<QueueMapping>;
  hits: number;
  misses: number;

  constructor(inner: QueueMappingStore, cacheValue: cache.TtlCache<QueueMapping>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueMapping | undefined {
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

  save(item: QueueMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueMapping[] {
    return this.inner.list();
  }
}

export function newCachedQueueMappingStore(inner: QueueMappingStore, ttl: number, clockValue: clock.Clock): QueueMappingStore {
  return new CachedQueueMappingStore(inner, cache.newTtlCache<QueueMapping>(64, ttl, clockValue), 0, 0);
}

/** Selects queue mappings. Empty fields match all. */
export class QueueMappingQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueMapping): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueMapping[]): QueueMapping[] {
    const matched = collections.filter(items, (candidate: QueueMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueMappings(store: QueueMappingStore, query: QueueMappingQuery): QueueMapping[] {
  return query.apply(store.list());
}
