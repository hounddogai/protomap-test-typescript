import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientOptOutScore } from "./lenient-opt-out-score.js";

/** Keeps lenient opt out scores by code. */
export interface LenientOptOutScoreStore {
  find(code: string): LenientOptOutScore | undefined;
  save(item: LenientOptOutScore): void;
  remove(code: string): boolean;
  list(): LenientOptOutScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientOptOutScoreStore implements LenientOptOutScoreStore {
  items: Map<string, LenientOptOutScore>;
  order: string[];

  constructor(items: Map<string, LenientOptOutScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientOptOutScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientOptOutScore): void {
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

  list(): LenientOptOutScore[] {
    const out: LenientOptOutScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientOptOutScoreStore(): LenientOptOutScoreStore {
  return new MemoryLenientOptOutScoreStore(new Map<string, LenientOptOutScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientOptOutScoreStore implements LenientOptOutScoreStore {
  inner: LenientOptOutScoreStore;
  cache: cache.TtlCache<LenientOptOutScore>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientOptOutScoreStore,
    cacheValue: cache.TtlCache<LenientOptOutScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientOptOutScore | undefined {
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

  save(item: LenientOptOutScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientOptOutScore[] {
    return this.inner.list();
  }
}

export function newCachedLenientOptOutScoreStore(inner: LenientOptOutScoreStore, ttl: number, clockValue: clock.Clock): LenientOptOutScoreStore {
  return new CachedLenientOptOutScoreStore(inner, cache.newTtlCache<LenientOptOutScore>(128, ttl, clockValue), 0, 0);
}

/** Selects lenient opt out scores. Empty fields match all. */
export class LenientOptOutScoreQuery {
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

  matches(item: LenientOptOutScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientOptOutScore[]): LenientOptOutScore[] {
    const matched = collections.filter(items, (candidate: LenientOptOutScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientOptOutScores(store: LenientOptOutScoreStore, query: LenientOptOutScoreQuery): LenientOptOutScore[] {
  return query.apply(store.list());
}
