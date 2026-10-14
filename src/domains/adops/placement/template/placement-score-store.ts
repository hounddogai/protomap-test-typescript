import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementScore } from "./placement-score.js";

/** Keeps placement scores by code. */
export interface PlacementScoreStore {
  find(code: string): PlacementScore | undefined;
  save(item: PlacementScore): void;
  remove(code: string): boolean;
  list(): PlacementScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementScoreStore implements PlacementScoreStore {
  items: Map<string, PlacementScore>;
  order: string[];

  constructor(items: Map<string, PlacementScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementScore): void {
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

  list(): PlacementScore[] {
    const out: PlacementScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementScoreStore(): PlacementScoreStore {
  return new MemoryPlacementScoreStore(new Map<string, PlacementScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementScoreStore implements PlacementScoreStore {
  inner: PlacementScoreStore;
  cache: cache.TtlCache<PlacementScore>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementScoreStore,
    cacheValue: cache.TtlCache<PlacementScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementScore | undefined {
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

  save(item: PlacementScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementScore[] {
    return this.inner.list();
  }
}

export function newCachedPlacementScoreStore(inner: PlacementScoreStore, ttl: number, clockValue: clock.Clock): PlacementScoreStore {
  return new CachedPlacementScoreStore(inner, cache.newTtlCache<PlacementScore>(64, ttl, clockValue), 0, 0);
}

/** Selects placement scores. Empty fields match all. */
export class PlacementScoreQuery {
  source: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minGraceDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementScore): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementScore[]): PlacementScore[] {
    const matched = collections.filter(items, (candidate: PlacementScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementScores(store: PlacementScoreStore, query: PlacementScoreQuery): PlacementScore[] {
  return query.apply(store.list());
}
