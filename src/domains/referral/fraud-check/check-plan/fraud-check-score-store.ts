import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckScore } from "./fraud-check-score.js";

/** Keeps fraud check scores by code. */
export interface FraudCheckScoreStore {
  find(code: string): FraudCheckScore | undefined;
  save(item: FraudCheckScore): void;
  remove(code: string): boolean;
  list(): FraudCheckScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckScoreStore implements FraudCheckScoreStore {
  items: Map<string, FraudCheckScore>;
  order: string[];

  constructor(items: Map<string, FraudCheckScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckScore): void {
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

  list(): FraudCheckScore[] {
    const out: FraudCheckScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckScoreStore(): FraudCheckScoreStore {
  return new MemoryFraudCheckScoreStore(new Map<string, FraudCheckScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckScoreStore implements FraudCheckScoreStore {
  inner: FraudCheckScoreStore;
  cache: cache.TtlCache<FraudCheckScore>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckScoreStore,
    cacheValue: cache.TtlCache<FraudCheckScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckScore | undefined {
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

  save(item: FraudCheckScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckScore[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckScoreStore(inner: FraudCheckScoreStore, ttl: number, clockValue: clock.Clock): FraudCheckScoreStore {
  return new CachedFraudCheckScoreStore(inner, cache.newTtlCache<FraudCheckScore>(64, ttl, clockValue), 0, 0);
}

/** Selects fraud check scores. Empty fields match all. */
export class FraudCheckScoreQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckScore[]): FraudCheckScore[] {
    const matched = collections.filter(items, (candidate: FraudCheckScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckScores(store: FraudCheckScoreStore, query: FraudCheckScoreQuery): FraudCheckScore[] {
  return query.apply(store.list());
}
