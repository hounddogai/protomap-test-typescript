import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueRollup } from "./queue-rollup.js";

/** Keeps queue rollups by code. */
export interface QueueRollupStore {
  find(code: string): QueueRollup | undefined;
  save(item: QueueRollup): void;
  remove(code: string): boolean;
  list(): QueueRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueRollupStore implements QueueRollupStore {
  items: Map<string, QueueRollup>;
  order: string[];

  constructor(items: Map<string, QueueRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueRollup): void {
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

  list(): QueueRollup[] {
    const out: QueueRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueRollupStore(): QueueRollupStore {
  return new MemoryQueueRollupStore(new Map<string, QueueRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueRollupStore implements QueueRollupStore {
  inner: QueueRollupStore;
  cache: cache.TtlCache<QueueRollup>;
  hits: number;
  misses: number;

  constructor(inner: QueueRollupStore, cacheValue: cache.TtlCache<QueueRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueRollup | undefined {
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

  save(item: QueueRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueRollup[] {
    return this.inner.list();
  }
}

export function newCachedQueueRollupStore(inner: QueueRollupStore, ttl: number, clockValue: clock.Clock): QueueRollupStore {
  return new CachedQueueRollupStore(inner, cache.newTtlCache<QueueRollup>(128, ttl, clockValue), 0, 0);
}

/** Selects queue rollups. Empty fields match all. */
export class QueueRollupQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueRollup): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueRollup[]): QueueRollup[] {
    const matched = collections.filter(items, (candidate: QueueRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueRollups(store: QueueRollupStore, query: QueueRollupQuery): QueueRollup[] {
  return query.apply(store.list());
}
