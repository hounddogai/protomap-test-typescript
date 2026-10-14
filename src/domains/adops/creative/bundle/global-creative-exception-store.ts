import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalCreativeException } from "./global-creative-exception.js";

/** Keeps global creative exceptions by code. */
export interface GlobalCreativeExceptionStore {
  find(code: string): GlobalCreativeException | undefined;
  save(item: GlobalCreativeException): void;
  remove(code: string): boolean;
  list(): GlobalCreativeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalCreativeExceptionStore implements GlobalCreativeExceptionStore {
  items: Map<string, GlobalCreativeException>;
  order: string[];

  constructor(items: Map<string, GlobalCreativeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalCreativeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalCreativeException): void {
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

  list(): GlobalCreativeException[] {
    const out: GlobalCreativeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalCreativeExceptionStore(): GlobalCreativeExceptionStore {
  return new MemoryGlobalCreativeExceptionStore(new Map<string, GlobalCreativeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalCreativeExceptionStore implements GlobalCreativeExceptionStore {
  inner: GlobalCreativeExceptionStore;
  cache: cache.TtlCache<GlobalCreativeException>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalCreativeExceptionStore,
    cacheValue: cache.TtlCache<GlobalCreativeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalCreativeException | undefined {
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

  save(item: GlobalCreativeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalCreativeException[] {
    return this.inner.list();
  }
}

export function newCachedGlobalCreativeExceptionStore(inner: GlobalCreativeExceptionStore, ttl: number, clockValue: clock.Clock): GlobalCreativeExceptionStore {
  return new CachedGlobalCreativeExceptionStore(
    inner,
    cache.newTtlCache<GlobalCreativeException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global creative exceptions. Empty fields match all. */
export class GlobalCreativeExceptionQuery {
  country: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minPriority: number, statuses: string[], limit: number) {
    this.country = country;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalCreativeException): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalCreativeException[]): GlobalCreativeException[] {
    const matched = collections.filter(items, (candidate: GlobalCreativeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalCreativeExceptions(store: GlobalCreativeExceptionStore, query: GlobalCreativeExceptionQuery): GlobalCreativeException[] {
  return query.apply(store.list());
}
