import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalModelException } from "./global-model-exception.js";

/** Keeps global model exceptions by code. */
export interface GlobalModelExceptionStore {
  find(code: string): GlobalModelException | undefined;
  save(item: GlobalModelException): void;
  remove(code: string): boolean;
  list(): GlobalModelException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalModelExceptionStore implements GlobalModelExceptionStore {
  items: Map<string, GlobalModelException>;
  order: string[];

  constructor(items: Map<string, GlobalModelException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalModelException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalModelException): void {
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

  list(): GlobalModelException[] {
    const out: GlobalModelException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalModelExceptionStore(): GlobalModelExceptionStore {
  return new MemoryGlobalModelExceptionStore(new Map<string, GlobalModelException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalModelExceptionStore implements GlobalModelExceptionStore {
  inner: GlobalModelExceptionStore;
  cache: cache.TtlCache<GlobalModelException>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalModelExceptionStore,
    cacheValue: cache.TtlCache<GlobalModelException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalModelException | undefined {
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

  save(item: GlobalModelException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalModelException[] {
    return this.inner.list();
  }
}

export function newCachedGlobalModelExceptionStore(inner: GlobalModelExceptionStore, ttl: number, clockValue: clock.Clock): GlobalModelExceptionStore {
  return new CachedGlobalModelExceptionStore(
    inner,
    cache.newTtlCache<GlobalModelException>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global model exceptions. Empty fields match all. */
export class GlobalModelExceptionQuery {
  locale: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minLimit: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalModelException): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalModelException[]): GlobalModelException[] {
    const matched = collections.filter(items, (candidate: GlobalModelException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalModelExceptions(store: GlobalModelExceptionStore, query: GlobalModelExceptionQuery): GlobalModelException[] {
  return query.apply(store.list());
}
