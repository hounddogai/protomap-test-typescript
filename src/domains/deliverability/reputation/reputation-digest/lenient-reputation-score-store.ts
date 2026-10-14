import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientReputationScore } from "./lenient-reputation-score.js";

/** Keeps lenient reputation scores by code. */
export interface LenientReputationScoreStore {
  find(code: string): LenientReputationScore | undefined;
  save(item: LenientReputationScore): void;
  remove(code: string): boolean;
  list(): LenientReputationScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientReputationScoreStore implements LenientReputationScoreStore {
  items: Map<string, LenientReputationScore>;
  order: string[];

  constructor(items: Map<string, LenientReputationScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientReputationScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientReputationScore): void {
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

  list(): LenientReputationScore[] {
    const out: LenientReputationScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientReputationScoreStore(): LenientReputationScoreStore {
  return new MemoryLenientReputationScoreStore(new Map<string, LenientReputationScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientReputationScoreStore implements LenientReputationScoreStore {
  inner: LenientReputationScoreStore;
  cache: cache.TtlCache<LenientReputationScore>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientReputationScoreStore,
    cacheValue: cache.TtlCache<LenientReputationScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientReputationScore | undefined {
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

  save(item: LenientReputationScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientReputationScore[] {
    return this.inner.list();
  }
}

export function newCachedLenientReputationScoreStore(inner: LenientReputationScoreStore, ttl: number, clockValue: clock.Clock): LenientReputationScoreStore {
  return new CachedLenientReputationScoreStore(
    inner,
    cache.newTtlCache<LenientReputationScore>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reputation scores. Empty fields match all. */
export class LenientReputationScoreQuery {
  source: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minEndsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientReputationScore): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientReputationScore[]): LenientReputationScore[] {
    const matched = collections.filter(items, (candidate: LenientReputationScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientReputationScores(store: LenientReputationScoreStore, query: LenientReputationScoreQuery): LenientReputationScore[] {
  return query.apply(store.list());
}
