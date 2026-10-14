import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingQueueTarget } from "./rolling-queue-target.js";

/** Keeps rolling queue targets by code. */
export interface RollingQueueTargetStore {
  find(code: string): RollingQueueTarget | undefined;
  save(item: RollingQueueTarget): void;
  remove(code: string): boolean;
  list(): RollingQueueTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingQueueTargetStore implements RollingQueueTargetStore {
  items: Map<string, RollingQueueTarget>;
  order: string[];

  constructor(items: Map<string, RollingQueueTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingQueueTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingQueueTarget): void {
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

  list(): RollingQueueTarget[] {
    const out: RollingQueueTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingQueueTargetStore(): RollingQueueTargetStore {
  return new MemoryRollingQueueTargetStore(new Map<string, RollingQueueTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingQueueTargetStore implements RollingQueueTargetStore {
  inner: RollingQueueTargetStore;
  cache: cache.TtlCache<RollingQueueTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingQueueTargetStore,
    cacheValue: cache.TtlCache<RollingQueueTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingQueueTarget | undefined {
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

  save(item: RollingQueueTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingQueueTarget[] {
    return this.inner.list();
  }
}

export function newCachedRollingQueueTargetStore(inner: RollingQueueTargetStore, ttl: number, clockValue: clock.Clock): RollingQueueTargetStore {
  return new CachedRollingQueueTargetStore(inner, cache.newTtlCache<RollingQueueTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling queue targets. Empty fields match all. */
export class RollingQueueTargetQuery {
  segment: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minPriority: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingQueueTarget): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingQueueTarget[]): RollingQueueTarget[] {
    const matched = collections.filter(items, (candidate: RollingQueueTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingQueueTargets(store: RollingQueueTargetStore, query: RollingQueueTargetQuery): RollingQueueTarget[] {
  return query.apply(store.list());
}
