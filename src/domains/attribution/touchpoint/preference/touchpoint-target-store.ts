import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointTarget } from "./touchpoint-target.js";

/** Keeps touchpoint targets by code. */
export interface TouchpointTargetStore {
  find(code: string): TouchpointTarget | undefined;
  save(item: TouchpointTarget): void;
  remove(code: string): boolean;
  list(): TouchpointTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointTargetStore implements TouchpointTargetStore {
  items: Map<string, TouchpointTarget>;
  order: string[];

  constructor(items: Map<string, TouchpointTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointTarget): void {
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

  list(): TouchpointTarget[] {
    const out: TouchpointTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointTargetStore(): TouchpointTargetStore {
  return new MemoryTouchpointTargetStore(new Map<string, TouchpointTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointTargetStore implements TouchpointTargetStore {
  inner: TouchpointTargetStore;
  cache: cache.TtlCache<TouchpointTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointTargetStore,
    cacheValue: cache.TtlCache<TouchpointTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointTarget | undefined {
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

  save(item: TouchpointTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointTarget[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointTargetStore(inner: TouchpointTargetStore, ttl: number, clockValue: clock.Clock): TouchpointTargetStore {
  return new CachedTouchpointTargetStore(inner, cache.newTtlCache<TouchpointTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects touchpoint targets. Empty fields match all. */
export class TouchpointTargetQuery {
  segment: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minImpressions: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointTarget): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointTarget[]): TouchpointTarget[] {
    const matched = collections.filter(items, (candidate: TouchpointTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointTargets(store: TouchpointTargetStore, query: TouchpointTargetQuery): TouchpointTarget[] {
  return query.apply(store.list());
}
