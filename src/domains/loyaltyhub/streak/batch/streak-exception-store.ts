import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakException } from "./streak-exception.js";

/** Keeps streak exceptions by code. */
export interface StreakExceptionStore {
  find(code: string): StreakException | undefined;
  save(item: StreakException): void;
  remove(code: string): boolean;
  list(): StreakException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakExceptionStore implements StreakExceptionStore {
  items: Map<string, StreakException>;
  order: string[];

  constructor(items: Map<string, StreakException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakException): void {
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

  list(): StreakException[] {
    const out: StreakException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakExceptionStore(): StreakExceptionStore {
  return new MemoryStreakExceptionStore(new Map<string, StreakException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakExceptionStore implements StreakExceptionStore {
  inner: StreakExceptionStore;
  cache: cache.TtlCache<StreakException>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakExceptionStore,
    cacheValue: cache.TtlCache<StreakException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakException | undefined {
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

  save(item: StreakException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakException[] {
    return this.inner.list();
  }
}

export function newCachedStreakExceptionStore(inner: StreakExceptionStore, ttl: number, clockValue: clock.Clock): StreakExceptionStore {
  return new CachedStreakExceptionStore(inner, cache.newTtlCache<StreakException>(64, ttl, clockValue), 0, 0);
}

/** Selects streak exceptions. Empty fields match all. */
export class StreakExceptionQuery {
  name: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSequence: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakException): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakException[]): StreakException[] {
    const matched = collections.filter(items, (candidate: StreakException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakExceptions(store: StreakExceptionStore, query: StreakExceptionQuery): StreakException[] {
  return query.apply(store.list());
}
