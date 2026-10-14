import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingBounceScore } from "./pending-bounce-score.js";

/** Keeps pending bounce scores by code. */
export interface PendingBounceScoreStore {
  find(code: string): PendingBounceScore | undefined;
  save(item: PendingBounceScore): void;
  remove(code: string): boolean;
  list(): PendingBounceScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingBounceScoreStore implements PendingBounceScoreStore {
  items: Map<string, PendingBounceScore>;
  order: string[];

  constructor(items: Map<string, PendingBounceScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingBounceScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingBounceScore): void {
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

  list(): PendingBounceScore[] {
    const out: PendingBounceScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingBounceScoreStore(): PendingBounceScoreStore {
  return new MemoryPendingBounceScoreStore(new Map<string, PendingBounceScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingBounceScoreStore implements PendingBounceScoreStore {
  inner: PendingBounceScoreStore;
  cache: cache.TtlCache<PendingBounceScore>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingBounceScoreStore,
    cacheValue: cache.TtlCache<PendingBounceScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingBounceScore | undefined {
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

  save(item: PendingBounceScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingBounceScore[] {
    return this.inner.list();
  }
}

export function newCachedPendingBounceScoreStore(inner: PendingBounceScoreStore, ttl: number, clockValue: clock.Clock): PendingBounceScoreStore {
  return new CachedPendingBounceScoreStore(inner, cache.newTtlCache<PendingBounceScore>(256, ttl, clockValue), 0, 0);
}

/** Selects pending bounce scores. Empty fields match all. */
export class PendingBounceScoreQuery {
  unit: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMargin: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingBounceScore): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingBounceScore[]): PendingBounceScore[] {
    const matched = collections.filter(items, (candidate: PendingBounceScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingBounceScores(store: PendingBounceScoreStore, query: PendingBounceScoreQuery): PendingBounceScore[] {
  return query.apply(store.list());
}
