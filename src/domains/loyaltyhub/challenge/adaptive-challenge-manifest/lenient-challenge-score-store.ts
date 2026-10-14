import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientChallengeScore } from "./lenient-challenge-score.js";

/** Keeps lenient challenge scores by code. */
export interface LenientChallengeScoreStore {
  find(code: string): LenientChallengeScore | undefined;
  save(item: LenientChallengeScore): void;
  remove(code: string): boolean;
  list(): LenientChallengeScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientChallengeScoreStore implements LenientChallengeScoreStore {
  items: Map<string, LenientChallengeScore>;
  order: string[];

  constructor(items: Map<string, LenientChallengeScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientChallengeScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientChallengeScore): void {
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

  list(): LenientChallengeScore[] {
    const out: LenientChallengeScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientChallengeScoreStore(): LenientChallengeScoreStore {
  return new MemoryLenientChallengeScoreStore(new Map<string, LenientChallengeScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientChallengeScoreStore implements LenientChallengeScoreStore {
  inner: LenientChallengeScoreStore;
  cache: cache.TtlCache<LenientChallengeScore>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientChallengeScoreStore,
    cacheValue: cache.TtlCache<LenientChallengeScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientChallengeScore | undefined {
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

  save(item: LenientChallengeScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientChallengeScore[] {
    return this.inner.list();
  }
}

export function newCachedLenientChallengeScoreStore(inner: LenientChallengeScoreStore, ttl: number, clockValue: clock.Clock): LenientChallengeScoreStore {
  return new CachedLenientChallengeScoreStore(
    inner,
    cache.newTtlCache<LenientChallengeScore>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient challenge scores. Empty fields match all. */
export class LenientChallengeScoreQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientChallengeScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientChallengeScore[]): LenientChallengeScore[] {
    const matched = collections.filter(items, (candidate: LenientChallengeScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientChallengeScores(store: LenientChallengeScoreStore, query: LenientChallengeScoreQuery): LenientChallengeScore[] {
  return query.apply(store.list());
}
