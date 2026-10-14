import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveQueueTarget } from "./adaptive-queue-target.js";

/** Keeps adaptive queue targets by code. */
export interface AdaptiveQueueTargetStore {
  find(code: string): AdaptiveQueueTarget | undefined;
  save(item: AdaptiveQueueTarget): void;
  remove(code: string): boolean;
  list(): AdaptiveQueueTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveQueueTargetStore implements AdaptiveQueueTargetStore {
  items: Map<string, AdaptiveQueueTarget>;
  order: string[];

  constructor(items: Map<string, AdaptiveQueueTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveQueueTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveQueueTarget): void {
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

  list(): AdaptiveQueueTarget[] {
    const out: AdaptiveQueueTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveQueueTargetStore(): AdaptiveQueueTargetStore {
  return new MemoryAdaptiveQueueTargetStore(new Map<string, AdaptiveQueueTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveQueueTargetStore implements AdaptiveQueueTargetStore {
  inner: AdaptiveQueueTargetStore;
  cache: cache.TtlCache<AdaptiveQueueTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveQueueTargetStore,
    cacheValue: cache.TtlCache<AdaptiveQueueTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveQueueTarget | undefined {
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

  save(item: AdaptiveQueueTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveQueueTarget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveQueueTargetStore(inner: AdaptiveQueueTargetStore, ttl: number, clockValue: clock.Clock): AdaptiveQueueTargetStore {
  return new CachedAdaptiveQueueTargetStore(inner, cache.newTtlCache<AdaptiveQueueTarget>(1024, ttl, clockValue), 0, 0);
}

/** Selects adaptive queue targets. Empty fields match all. */
export class AdaptiveQueueTargetQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveQueueTarget): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveQueueTarget[]): AdaptiveQueueTarget[] {
    const matched = collections.filter(items, (candidate: AdaptiveQueueTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveQueueTargets(store: AdaptiveQueueTargetStore, query: AdaptiveQueueTargetQuery): AdaptiveQueueTarget[] {
  return query.apply(store.list());
}
