import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionScore } from "./suppression-score.js";

/** Keeps suppression scores by code. */
export interface SuppressionScoreStore {
  find(code: string): SuppressionScore | undefined;
  save(item: SuppressionScore): void;
  remove(code: string): boolean;
  list(): SuppressionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionScoreStore implements SuppressionScoreStore {
  items: Map<string, SuppressionScore>;
  order: string[];

  constructor(items: Map<string, SuppressionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionScore): void {
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

  list(): SuppressionScore[] {
    const out: SuppressionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionScoreStore(): SuppressionScoreStore {
  return new MemorySuppressionScoreStore(new Map<string, SuppressionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionScoreStore implements SuppressionScoreStore {
  inner: SuppressionScoreStore;
  cache: cache.TtlCache<SuppressionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionScoreStore,
    cacheValue: cache.TtlCache<SuppressionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionScore | undefined {
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

  save(item: SuppressionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionScore[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionScoreStore(inner: SuppressionScoreStore, ttl: number, clockValue: clock.Clock): SuppressionScoreStore {
  return new CachedSuppressionScoreStore(inner, cache.newTtlCache<SuppressionScore>(512, ttl, clockValue), 0, 0);
}

/** Selects suppression scores. Empty fields match all. */
export class SuppressionScoreQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionScore): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionScore[]): SuppressionScore[] {
    const matched = collections.filter(items, (candidate: SuppressionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionScores(store: SuppressionScoreStore, query: SuppressionScoreQuery): SuppressionScore[] {
  return query.apply(store.list());
}
