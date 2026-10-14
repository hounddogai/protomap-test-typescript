import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueBaseline } from "./queue-baseline.js";

/** Keeps queue baselines by code. */
export interface QueueBaselineStore {
  find(code: string): QueueBaseline | undefined;
  save(item: QueueBaseline): void;
  remove(code: string): boolean;
  list(): QueueBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueBaselineStore implements QueueBaselineStore {
  items: Map<string, QueueBaseline>;
  order: string[];

  constructor(items: Map<string, QueueBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueBaseline): void {
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

  list(): QueueBaseline[] {
    const out: QueueBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueBaselineStore(): QueueBaselineStore {
  return new MemoryQueueBaselineStore(new Map<string, QueueBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueBaselineStore implements QueueBaselineStore {
  inner: QueueBaselineStore;
  cache: cache.TtlCache<QueueBaseline>;
  hits: number;
  misses: number;

  constructor(inner: QueueBaselineStore, cacheValue: cache.TtlCache<QueueBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueBaseline | undefined {
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

  save(item: QueueBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueBaseline[] {
    return this.inner.list();
  }
}

export function newCachedQueueBaselineStore(inner: QueueBaselineStore, ttl: number, clockValue: clock.Clock): QueueBaselineStore {
  return new CachedQueueBaselineStore(inner, cache.newTtlCache<QueueBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects queue baselines. Empty fields match all. */
export class QueueBaselineQuery {
  unit: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueBaseline): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueBaseline[]): QueueBaseline[] {
    const matched = collections.filter(items, (candidate: QueueBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueBaselines(store: QueueBaselineStore, query: QueueBaselineQuery): QueueBaseline[] {
  return query.apply(store.list());
}
