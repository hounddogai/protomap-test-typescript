import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPostScore } from "./fallback-post-score.js";

/** Keeps fallback post scores by code. */
export interface FallbackPostScoreStore {
  find(code: string): FallbackPostScore | undefined;
  save(item: FallbackPostScore): void;
  remove(code: string): boolean;
  list(): FallbackPostScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPostScoreStore implements FallbackPostScoreStore {
  items: Map<string, FallbackPostScore>;
  order: string[];

  constructor(items: Map<string, FallbackPostScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPostScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPostScore): void {
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

  list(): FallbackPostScore[] {
    const out: FallbackPostScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPostScoreStore(): FallbackPostScoreStore {
  return new MemoryFallbackPostScoreStore(new Map<string, FallbackPostScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPostScoreStore implements FallbackPostScoreStore {
  inner: FallbackPostScoreStore;
  cache: cache.TtlCache<FallbackPostScore>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPostScoreStore,
    cacheValue: cache.TtlCache<FallbackPostScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPostScore | undefined {
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

  save(item: FallbackPostScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPostScore[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPostScoreStore(inner: FallbackPostScoreStore, ttl: number, clockValue: clock.Clock): FallbackPostScoreStore {
  return new CachedFallbackPostScoreStore(inner, cache.newTtlCache<FallbackPostScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects fallback post scores. Empty fields match all. */
export class FallbackPostScoreQuery {
  category: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRevision: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPostScore): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPostScore[]): FallbackPostScore[] {
    const matched = collections.filter(items, (candidate: FallbackPostScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPostScores(store: FallbackPostScoreStore, query: FallbackPostScoreQuery): FallbackPostScore[] {
  return query.apply(store.list());
}
