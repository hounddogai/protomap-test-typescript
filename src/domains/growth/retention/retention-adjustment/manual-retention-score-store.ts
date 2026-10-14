import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRetentionScore } from "./manual-retention-score.js";

/** Keeps manual retention scores by code. */
export interface ManualRetentionScoreStore {
  find(code: string): ManualRetentionScore | undefined;
  save(item: ManualRetentionScore): void;
  remove(code: string): boolean;
  list(): ManualRetentionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRetentionScoreStore implements ManualRetentionScoreStore {
  items: Map<string, ManualRetentionScore>;
  order: string[];

  constructor(items: Map<string, ManualRetentionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRetentionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRetentionScore): void {
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

  list(): ManualRetentionScore[] {
    const out: ManualRetentionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRetentionScoreStore(): ManualRetentionScoreStore {
  return new MemoryManualRetentionScoreStore(new Map<string, ManualRetentionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRetentionScoreStore implements ManualRetentionScoreStore {
  inner: ManualRetentionScoreStore;
  cache: cache.TtlCache<ManualRetentionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRetentionScoreStore,
    cacheValue: cache.TtlCache<ManualRetentionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRetentionScore | undefined {
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

  save(item: ManualRetentionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRetentionScore[] {
    return this.inner.list();
  }
}

export function newCachedManualRetentionScoreStore(inner: ManualRetentionScoreStore, ttl: number, clockValue: clock.Clock): ManualRetentionScoreStore {
  return new CachedManualRetentionScoreStore(inner, cache.newTtlCache<ManualRetentionScore>(64, ttl, clockValue), 0, 0);
}

/** Selects manual retention scores. Empty fields match all. */
export class ManualRetentionScoreQuery {
  name: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCost: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRetentionScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRetentionScore[]): ManualRetentionScore[] {
    const matched = collections.filter(items, (candidate: ManualRetentionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRetentionScores(store: ManualRetentionScoreStore, query: ManualRetentionScoreQuery): ManualRetentionScore[] {
  return query.apply(store.list());
}
