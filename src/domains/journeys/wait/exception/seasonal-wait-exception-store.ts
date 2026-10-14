import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalWaitException } from "./seasonal-wait-exception.js";

/** Keeps seasonal wait exceptions by code. */
export interface SeasonalWaitExceptionStore {
  find(code: string): SeasonalWaitException | undefined;
  save(item: SeasonalWaitException): void;
  remove(code: string): boolean;
  list(): SeasonalWaitException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalWaitExceptionStore implements SeasonalWaitExceptionStore {
  items: Map<string, SeasonalWaitException>;
  order: string[];

  constructor(items: Map<string, SeasonalWaitException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalWaitException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalWaitException): void {
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

  list(): SeasonalWaitException[] {
    const out: SeasonalWaitException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalWaitExceptionStore(): SeasonalWaitExceptionStore {
  return new MemorySeasonalWaitExceptionStore(new Map<string, SeasonalWaitException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalWaitExceptionStore implements SeasonalWaitExceptionStore {
  inner: SeasonalWaitExceptionStore;
  cache: cache.TtlCache<SeasonalWaitException>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalWaitExceptionStore,
    cacheValue: cache.TtlCache<SeasonalWaitException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalWaitException | undefined {
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

  save(item: SeasonalWaitException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalWaitException[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalWaitExceptionStore(inner: SeasonalWaitExceptionStore, ttl: number, clockValue: clock.Clock): SeasonalWaitExceptionStore {
  return new CachedSeasonalWaitExceptionStore(
    inner,
    cache.newTtlCache<SeasonalWaitException>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal wait exceptions. Empty fields match all. */
export class SeasonalWaitExceptionQuery {
  title: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.title = title;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalWaitException): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalWaitException[]): SeasonalWaitException[] {
    const matched = collections.filter(items, (candidate: SeasonalWaitException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalWaitExceptions(store: SeasonalWaitExceptionStore, query: SeasonalWaitExceptionQuery): SeasonalWaitException[] {
  return query.apply(store.list());
}
