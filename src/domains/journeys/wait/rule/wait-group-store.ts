import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitGroup } from "./wait-group.js";

/** Keeps wait groups by code. */
export interface WaitGroupStore {
  find(code: string): WaitGroup | undefined;
  save(item: WaitGroup): void;
  remove(code: string): boolean;
  list(): WaitGroup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitGroupStore implements WaitGroupStore {
  items: Map<string, WaitGroup>;
  order: string[];

  constructor(items: Map<string, WaitGroup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitGroup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitGroup): void {
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

  list(): WaitGroup[] {
    const out: WaitGroup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitGroupStore(): WaitGroupStore {
  return new MemoryWaitGroupStore(new Map<string, WaitGroup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitGroupStore implements WaitGroupStore {
  inner: WaitGroupStore;
  cache: cache.TtlCache<WaitGroup>;
  hits: number;
  misses: number;

  constructor(inner: WaitGroupStore, cacheValue: cache.TtlCache<WaitGroup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitGroup | undefined {
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

  save(item: WaitGroup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitGroup[] {
    return this.inner.list();
  }
}

export function newCachedWaitGroupStore(inner: WaitGroupStore, ttl: number, clockValue: clock.Clock): WaitGroupStore {
  return new CachedWaitGroupStore(inner, cache.newTtlCache<WaitGroup>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait groups. Empty fields match all. */
export class WaitGroupQuery {
  title: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minScore: number, statuses: string[], limit: number) {
    this.title = title;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitGroup): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitGroup[]): WaitGroup[] {
    const matched = collections.filter(items, (candidate: WaitGroup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitGroups(store: WaitGroupStore, query: WaitGroupQuery): WaitGroup[] {
  return query.apply(store.list());
}
