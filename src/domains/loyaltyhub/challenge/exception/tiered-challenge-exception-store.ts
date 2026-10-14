import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredChallengeException } from "./tiered-challenge-exception.js";

/** Keeps tiered challenge exceptions by code. */
export interface TieredChallengeExceptionStore {
  find(code: string): TieredChallengeException | undefined;
  save(item: TieredChallengeException): void;
  remove(code: string): boolean;
  list(): TieredChallengeException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredChallengeExceptionStore implements TieredChallengeExceptionStore {
  items: Map<string, TieredChallengeException>;
  order: string[];

  constructor(items: Map<string, TieredChallengeException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredChallengeException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredChallengeException): void {
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

  list(): TieredChallengeException[] {
    const out: TieredChallengeException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredChallengeExceptionStore(): TieredChallengeExceptionStore {
  return new MemoryTieredChallengeExceptionStore(new Map<string, TieredChallengeException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredChallengeExceptionStore implements TieredChallengeExceptionStore {
  inner: TieredChallengeExceptionStore;
  cache: cache.TtlCache<TieredChallengeException>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredChallengeExceptionStore,
    cacheValue: cache.TtlCache<TieredChallengeException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredChallengeException | undefined {
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

  save(item: TieredChallengeException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredChallengeException[] {
    return this.inner.list();
  }
}

export function newCachedTieredChallengeExceptionStore(inner: TieredChallengeExceptionStore, ttl: number, clockValue: clock.Clock): TieredChallengeExceptionStore {
  return new CachedTieredChallengeExceptionStore(
    inner,
    cache.newTtlCache<TieredChallengeException>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered challenge exceptions. Empty fields match all. */
export class TieredChallengeExceptionQuery {
  title: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredChallengeException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredChallengeException[]): TieredChallengeException[] {
    const matched = collections.filter(items, (candidate: TieredChallengeException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredChallengeExceptions(store: TieredChallengeExceptionStore, query: TieredChallengeExceptionQuery): TieredChallengeException[] {
  return query.apply(store.list());
}
