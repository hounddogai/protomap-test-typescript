import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitTarget } from "./wait-target.js";

/** Keeps wait targets by code. */
export interface WaitTargetStore {
  find(code: string): WaitTarget | undefined;
  save(item: WaitTarget): void;
  remove(code: string): boolean;
  list(): WaitTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitTargetStore implements WaitTargetStore {
  items: Map<string, WaitTarget>;
  order: string[];

  constructor(items: Map<string, WaitTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitTarget): void {
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

  list(): WaitTarget[] {
    const out: WaitTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitTargetStore(): WaitTargetStore {
  return new MemoryWaitTargetStore(new Map<string, WaitTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitTargetStore implements WaitTargetStore {
  inner: WaitTargetStore;
  cache: cache.TtlCache<WaitTarget>;
  hits: number;
  misses: number;

  constructor(inner: WaitTargetStore, cacheValue: cache.TtlCache<WaitTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitTarget | undefined {
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

  save(item: WaitTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitTarget[] {
    return this.inner.list();
  }
}

export function newCachedWaitTargetStore(inner: WaitTargetStore, ttl: number, clockValue: clock.Clock): WaitTargetStore {
  return new CachedWaitTargetStore(inner, cache.newTtlCache<WaitTarget>(512, ttl, clockValue), 0, 0);
}

/** Selects wait targets. Empty fields match all. */
export class WaitTargetQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitTarget): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitTarget[]): WaitTarget[] {
    const matched = collections.filter(items, (candidate: WaitTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitTargets(store: WaitTargetStore, query: WaitTargetQuery): WaitTarget[] {
  return query.apply(store.list());
}
