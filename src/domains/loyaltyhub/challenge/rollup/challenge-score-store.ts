import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeScore } from "./challenge-score.js";

/** Keeps challenge scores by code. */
export interface ChallengeScoreStore {
  find(code: string): ChallengeScore | undefined;
  save(item: ChallengeScore): void;
  remove(code: string): boolean;
  list(): ChallengeScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeScoreStore implements ChallengeScoreStore {
  items: Map<string, ChallengeScore>;
  order: string[];

  constructor(items: Map<string, ChallengeScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeScore): void {
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

  list(): ChallengeScore[] {
    const out: ChallengeScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeScoreStore(): ChallengeScoreStore {
  return new MemoryChallengeScoreStore(new Map<string, ChallengeScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeScoreStore implements ChallengeScoreStore {
  inner: ChallengeScoreStore;
  cache: cache.TtlCache<ChallengeScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeScoreStore,
    cacheValue: cache.TtlCache<ChallengeScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeScore | undefined {
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

  save(item: ChallengeScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeScore[] {
    return this.inner.list();
  }
}

export function newCachedChallengeScoreStore(inner: ChallengeScoreStore, ttl: number, clockValue: clock.Clock): ChallengeScoreStore {
  return new CachedChallengeScoreStore(inner, cache.newTtlCache<ChallengeScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge scores. Empty fields match all. */
export class ChallengeScoreQuery {
  region: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minEndsAt: number, statuses: string[], limit: number) {
    this.region = region;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeScore): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeScore[]): ChallengeScore[] {
    const matched = collections.filter(items, (candidate: ChallengeScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeScores(store: ChallengeScoreStore, query: ChallengeScoreQuery): ChallengeScore[] {
  return query.apply(store.list());
}
