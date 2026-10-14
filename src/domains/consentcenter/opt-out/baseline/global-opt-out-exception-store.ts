import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalOptOutException } from "./global-opt-out-exception.js";

/** Keeps global opt out exceptions by code. */
export interface GlobalOptOutExceptionStore {
  find(code: string): GlobalOptOutException | undefined;
  save(item: GlobalOptOutException): void;
  remove(code: string): boolean;
  list(): GlobalOptOutException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalOptOutExceptionStore implements GlobalOptOutExceptionStore {
  items: Map<string, GlobalOptOutException>;
  order: string[];

  constructor(items: Map<string, GlobalOptOutException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalOptOutException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalOptOutException): void {
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

  list(): GlobalOptOutException[] {
    const out: GlobalOptOutException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalOptOutExceptionStore(): GlobalOptOutExceptionStore {
  return new MemoryGlobalOptOutExceptionStore(new Map<string, GlobalOptOutException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalOptOutExceptionStore implements GlobalOptOutExceptionStore {
  inner: GlobalOptOutExceptionStore;
  cache: cache.TtlCache<GlobalOptOutException>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalOptOutExceptionStore,
    cacheValue: cache.TtlCache<GlobalOptOutException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalOptOutException | undefined {
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

  save(item: GlobalOptOutException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalOptOutException[] {
    return this.inner.list();
  }
}

export function newCachedGlobalOptOutExceptionStore(inner: GlobalOptOutExceptionStore, ttl: number, clockValue: clock.Clock): GlobalOptOutExceptionStore {
  return new CachedGlobalOptOutExceptionStore(
    inner,
    cache.newTtlCache<GlobalOptOutException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global opt out exceptions. Empty fields match all. */
export class GlobalOptOutExceptionQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalOptOutException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalOptOutException[]): GlobalOptOutException[] {
    const matched = collections.filter(items, (candidate: GlobalOptOutException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalOptOutExceptions(store: GlobalOptOutExceptionStore, query: GlobalOptOutExceptionQuery): GlobalOptOutException[] {
  return query.apply(store.list());
}
