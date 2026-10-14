import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictQueueTarget } from "./strict-queue-target.js";

/** Keeps strict queue targets by code. */
export interface StrictQueueTargetStore {
  find(code: string): StrictQueueTarget | undefined;
  save(item: StrictQueueTarget): void;
  remove(code: string): boolean;
  list(): StrictQueueTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictQueueTargetStore implements StrictQueueTargetStore {
  items: Map<string, StrictQueueTarget>;
  order: string[];

  constructor(items: Map<string, StrictQueueTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictQueueTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictQueueTarget): void {
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

  list(): StrictQueueTarget[] {
    const out: StrictQueueTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictQueueTargetStore(): StrictQueueTargetStore {
  return new MemoryStrictQueueTargetStore(new Map<string, StrictQueueTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictQueueTargetStore implements StrictQueueTargetStore {
  inner: StrictQueueTargetStore;
  cache: cache.TtlCache<StrictQueueTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictQueueTargetStore,
    cacheValue: cache.TtlCache<StrictQueueTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictQueueTarget | undefined {
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

  save(item: StrictQueueTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictQueueTarget[] {
    return this.inner.list();
  }
}

export function newCachedStrictQueueTargetStore(inner: StrictQueueTargetStore, ttl: number, clockValue: clock.Clock): StrictQueueTargetStore {
  return new CachedStrictQueueTargetStore(inner, cache.newTtlCache<StrictQueueTarget>(128, ttl, clockValue), 0, 0);
}

/** Selects strict queue targets. Empty fields match all. */
export class StrictQueueTargetQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictQueueTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictQueueTarget[]): StrictQueueTarget[] {
    const matched = collections.filter(items, (candidate: StrictQueueTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictQueueTargets(store: StrictQueueTargetStore, query: StrictQueueTargetQuery): StrictQueueTarget[] {
  return query.apply(store.list());
}
