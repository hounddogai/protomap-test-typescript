import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalInsightScore } from "./regional-insight-score.js";

/** Keeps regional insight scores by code. */
export interface RegionalInsightScoreStore {
  find(code: string): RegionalInsightScore | undefined;
  save(item: RegionalInsightScore): void;
  remove(code: string): boolean;
  list(): RegionalInsightScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalInsightScoreStore implements RegionalInsightScoreStore {
  items: Map<string, RegionalInsightScore>;
  order: string[];

  constructor(items: Map<string, RegionalInsightScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalInsightScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalInsightScore): void {
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

  list(): RegionalInsightScore[] {
    const out: RegionalInsightScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalInsightScoreStore(): RegionalInsightScoreStore {
  return new MemoryRegionalInsightScoreStore(new Map<string, RegionalInsightScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalInsightScoreStore implements RegionalInsightScoreStore {
  inner: RegionalInsightScoreStore;
  cache: cache.TtlCache<RegionalInsightScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalInsightScoreStore,
    cacheValue: cache.TtlCache<RegionalInsightScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalInsightScore | undefined {
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

  save(item: RegionalInsightScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalInsightScore[] {
    return this.inner.list();
  }
}

export function newCachedRegionalInsightScoreStore(inner: RegionalInsightScoreStore, ttl: number, clockValue: clock.Clock): RegionalInsightScoreStore {
  return new CachedRegionalInsightScoreStore(
    inner,
    cache.newTtlCache<RegionalInsightScore>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional insight scores. Empty fields match all. */
export class RegionalInsightScoreQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalInsightScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalInsightScore[]): RegionalInsightScore[] {
    const matched = collections.filter(items, (candidate: RegionalInsightScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalInsightScores(store: RegionalInsightScoreStore, query: RegionalInsightScoreQuery): RegionalInsightScore[] {
  return query.apply(store.list());
}
