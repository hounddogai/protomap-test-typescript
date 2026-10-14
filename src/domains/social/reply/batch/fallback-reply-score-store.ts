import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackReplyScore } from "./fallback-reply-score.js";

/** Keeps fallback reply scores by code. */
export interface FallbackReplyScoreStore {
  find(code: string): FallbackReplyScore | undefined;
  save(item: FallbackReplyScore): void;
  remove(code: string): boolean;
  list(): FallbackReplyScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackReplyScoreStore implements FallbackReplyScoreStore {
  items: Map<string, FallbackReplyScore>;
  order: string[];

  constructor(items: Map<string, FallbackReplyScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackReplyScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackReplyScore): void {
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

  list(): FallbackReplyScore[] {
    const out: FallbackReplyScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackReplyScoreStore(): FallbackReplyScoreStore {
  return new MemoryFallbackReplyScoreStore(new Map<string, FallbackReplyScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackReplyScoreStore implements FallbackReplyScoreStore {
  inner: FallbackReplyScoreStore;
  cache: cache.TtlCache<FallbackReplyScore>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackReplyScoreStore,
    cacheValue: cache.TtlCache<FallbackReplyScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackReplyScore | undefined {
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

  save(item: FallbackReplyScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackReplyScore[] {
    return this.inner.list();
  }
}

export function newCachedFallbackReplyScoreStore(inner: FallbackReplyScoreStore, ttl: number, clockValue: clock.Clock): FallbackReplyScoreStore {
  return new CachedFallbackReplyScoreStore(inner, cache.newTtlCache<FallbackReplyScore>(256, ttl, clockValue), 0, 0);
}

/** Selects fallback reply scores. Empty fields match all. */
export class FallbackReplyScoreQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackReplyScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackReplyScore[]): FallbackReplyScore[] {
    const matched = collections.filter(items, (candidate: FallbackReplyScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackReplyScores(store: FallbackReplyScoreStore, query: FallbackReplyScoreQuery): FallbackReplyScore[] {
  return query.apply(store.list());
}
