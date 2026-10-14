import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupException } from "./warmup-exception.js";

/** Keeps warmup exceptions by code. */
export interface WarmupExceptionStore {
  find(code: string): WarmupException | undefined;
  save(item: WarmupException): void;
  remove(code: string): boolean;
  list(): WarmupException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupExceptionStore implements WarmupExceptionStore {
  items: Map<string, WarmupException>;
  order: string[];

  constructor(items: Map<string, WarmupException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupException): void {
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

  list(): WarmupException[] {
    const out: WarmupException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupExceptionStore(): WarmupExceptionStore {
  return new MemoryWarmupExceptionStore(new Map<string, WarmupException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupExceptionStore implements WarmupExceptionStore {
  inner: WarmupExceptionStore;
  cache: cache.TtlCache<WarmupException>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupExceptionStore,
    cacheValue: cache.TtlCache<WarmupException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupException | undefined {
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

  save(item: WarmupException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupException[] {
    return this.inner.list();
  }
}

export function newCachedWarmupExceptionStore(inner: WarmupExceptionStore, ttl: number, clockValue: clock.Clock): WarmupExceptionStore {
  return new CachedWarmupExceptionStore(inner, cache.newTtlCache<WarmupException>(64, ttl, clockValue), 0, 0);
}

/** Selects warmup exceptions. Empty fields match all. */
export class WarmupExceptionQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupException[]): WarmupException[] {
    const matched = collections.filter(items, (candidate: WarmupException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupExceptions(store: WarmupExceptionStore, query: WarmupExceptionQuery): WarmupException[] {
  return query.apply(store.list());
}
