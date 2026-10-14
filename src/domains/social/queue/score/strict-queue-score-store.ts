import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictQueueScore } from "./strict-queue-score.js";

/** Keeps strict queue scores by code. */
export interface StrictQueueScoreStore {
  find(code: string): StrictQueueScore | undefined;
  save(item: StrictQueueScore): void;
  remove(code: string): boolean;
  list(): StrictQueueScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictQueueScoreStore implements StrictQueueScoreStore {
  items: Map<string, StrictQueueScore>;
  order: string[];

  constructor(items: Map<string, StrictQueueScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictQueueScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictQueueScore): void {
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

  list(): StrictQueueScore[] {
    const out: StrictQueueScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictQueueScoreStore(): StrictQueueScoreStore {
  return new MemoryStrictQueueScoreStore(new Map<string, StrictQueueScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictQueueScoreStore implements StrictQueueScoreStore {
  inner: StrictQueueScoreStore;
  cache: cache.TtlCache<StrictQueueScore>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictQueueScoreStore,
    cacheValue: cache.TtlCache<StrictQueueScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictQueueScore | undefined {
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

  save(item: StrictQueueScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictQueueScore[] {
    return this.inner.list();
  }
}

export function newCachedStrictQueueScoreStore(inner: StrictQueueScoreStore, ttl: number, clockValue: clock.Clock): StrictQueueScoreStore {
  return new CachedStrictQueueScoreStore(inner, cache.newTtlCache<StrictQueueScore>(128, ttl, clockValue), 0, 0);
}

/** Selects strict queue scores. Empty fields match all. */
export class StrictQueueScoreQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictQueueScore): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictQueueScore[]): StrictQueueScore[] {
    const matched = collections.filter(items, (candidate: StrictQueueScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictQueueScores(store: StrictQueueScoreStore, query: StrictQueueScoreQuery): StrictQueueScore[] {
  return query.apply(store.list());
}
