import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathBaseline } from "./path-baseline.js";

/** Keeps path baselines by code. */
export interface PathBaselineStore {
  find(code: string): PathBaseline | undefined;
  save(item: PathBaseline): void;
  remove(code: string): boolean;
  list(): PathBaseline[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathBaselineStore implements PathBaselineStore {
  items: Map<string, PathBaseline>;
  order: string[];

  constructor(items: Map<string, PathBaseline>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathBaseline | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathBaseline): void {
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

  list(): PathBaseline[] {
    const out: PathBaseline[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathBaselineStore(): PathBaselineStore {
  return new MemoryPathBaselineStore(new Map<string, PathBaseline>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathBaselineStore implements PathBaselineStore {
  inner: PathBaselineStore;
  cache: cache.TtlCache<PathBaseline>;
  hits: number;
  misses: number;

  constructor(inner: PathBaselineStore, cacheValue: cache.TtlCache<PathBaseline>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathBaseline | undefined {
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

  save(item: PathBaseline): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathBaseline[] {
    return this.inner.list();
  }
}

export function newCachedPathBaselineStore(inner: PathBaselineStore, ttl: number, clockValue: clock.Clock): PathBaselineStore {
  return new CachedPathBaselineStore(inner, cache.newTtlCache<PathBaseline>(512, ttl, clockValue), 0, 0);
}

/** Selects path baselines. Empty fields match all. */
export class PathBaselineQuery {
  category: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathBaseline): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathBaseline[]): PathBaseline[] {
    const matched = collections.filter(items, (candidate: PathBaseline): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathBaselines(store: PathBaselineStore, query: PathBaselineQuery): PathBaseline[] {
  return query.apply(store.list());
}
