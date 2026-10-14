import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingRetentionScore } from "./rolling-retention-score.js";

/** Keeps rolling retention scores by code. */
export interface RollingRetentionScoreStore {
  find(code: string): RollingRetentionScore | undefined;
  save(item: RollingRetentionScore): void;
  remove(code: string): boolean;
  list(): RollingRetentionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingRetentionScoreStore implements RollingRetentionScoreStore {
  items: Map<string, RollingRetentionScore>;
  order: string[];

  constructor(items: Map<string, RollingRetentionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingRetentionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingRetentionScore): void {
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

  list(): RollingRetentionScore[] {
    const out: RollingRetentionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingRetentionScoreStore(): RollingRetentionScoreStore {
  return new MemoryRollingRetentionScoreStore(new Map<string, RollingRetentionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingRetentionScoreStore implements RollingRetentionScoreStore {
  inner: RollingRetentionScoreStore;
  cache: cache.TtlCache<RollingRetentionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingRetentionScoreStore,
    cacheValue: cache.TtlCache<RollingRetentionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingRetentionScore | undefined {
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

  save(item: RollingRetentionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingRetentionScore[] {
    return this.inner.list();
  }
}

export function newCachedRollingRetentionScoreStore(inner: RollingRetentionScoreStore, ttl: number, clockValue: clock.Clock): RollingRetentionScoreStore {
  return new CachedRollingRetentionScoreStore(
    inner,
    cache.newTtlCache<RollingRetentionScore>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling retention scores. Empty fields match all. */
export class RollingRetentionScoreQuery {
  label: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minDiscount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingRetentionScore): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingRetentionScore[]): RollingRetentionScore[] {
    const matched = collections.filter(items, (candidate: RollingRetentionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingRetentionScores(store: RollingRetentionScoreStore, query: RollingRetentionScoreQuery): RollingRetentionScore[] {
  return query.apply(store.list());
}
