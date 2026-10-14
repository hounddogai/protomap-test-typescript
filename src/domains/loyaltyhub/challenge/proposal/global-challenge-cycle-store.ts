import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalChallengeCycle } from "./global-challenge-cycle.js";

/** Keeps global challenge cycles by code. */
export interface GlobalChallengeCycleStore {
  find(code: string): GlobalChallengeCycle | undefined;
  save(item: GlobalChallengeCycle): void;
  remove(code: string): boolean;
  list(): GlobalChallengeCycle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalChallengeCycleStore implements GlobalChallengeCycleStore {
  items: Map<string, GlobalChallengeCycle>;
  order: string[];

  constructor(items: Map<string, GlobalChallengeCycle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalChallengeCycle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalChallengeCycle): void {
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

  list(): GlobalChallengeCycle[] {
    const out: GlobalChallengeCycle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalChallengeCycleStore(): GlobalChallengeCycleStore {
  return new MemoryGlobalChallengeCycleStore(new Map<string, GlobalChallengeCycle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalChallengeCycleStore implements GlobalChallengeCycleStore {
  inner: GlobalChallengeCycleStore;
  cache: cache.TtlCache<GlobalChallengeCycle>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalChallengeCycleStore,
    cacheValue: cache.TtlCache<GlobalChallengeCycle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalChallengeCycle | undefined {
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

  save(item: GlobalChallengeCycle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalChallengeCycle[] {
    return this.inner.list();
  }
}

export function newCachedGlobalChallengeCycleStore(inner: GlobalChallengeCycleStore, ttl: number, clockValue: clock.Clock): GlobalChallengeCycleStore {
  return new CachedGlobalChallengeCycleStore(
    inner,
    cache.newTtlCache<GlobalChallengeCycle>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global challenge cycles. Empty fields match all. */
export class GlobalChallengeCycleQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalChallengeCycle): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalChallengeCycle[]): GlobalChallengeCycle[] {
    const matched = collections.filter(items, (candidate: GlobalChallengeCycle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalChallengeCycles(store: GlobalChallengeCycleStore, query: GlobalChallengeCycleQuery): GlobalChallengeCycle[] {
  return query.apply(store.list());
}
