import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalApprovalScore } from "./seasonal-approval-score.js";

/** Keeps seasonal approval scores by code. */
export interface SeasonalApprovalScoreStore {
  find(code: string): SeasonalApprovalScore | undefined;
  save(item: SeasonalApprovalScore): void;
  remove(code: string): boolean;
  list(): SeasonalApprovalScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalApprovalScoreStore implements SeasonalApprovalScoreStore {
  items: Map<string, SeasonalApprovalScore>;
  order: string[];

  constructor(items: Map<string, SeasonalApprovalScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalApprovalScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalApprovalScore): void {
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

  list(): SeasonalApprovalScore[] {
    const out: SeasonalApprovalScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalApprovalScoreStore(): SeasonalApprovalScoreStore {
  return new MemorySeasonalApprovalScoreStore(new Map<string, SeasonalApprovalScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalApprovalScoreStore implements SeasonalApprovalScoreStore {
  inner: SeasonalApprovalScoreStore;
  cache: cache.TtlCache<SeasonalApprovalScore>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalApprovalScoreStore,
    cacheValue: cache.TtlCache<SeasonalApprovalScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalApprovalScore | undefined {
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

  save(item: SeasonalApprovalScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalApprovalScore[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalApprovalScoreStore(inner: SeasonalApprovalScoreStore, ttl: number, clockValue: clock.Clock): SeasonalApprovalScoreStore {
  return new CachedSeasonalApprovalScoreStore(
    inner,
    cache.newTtlCache<SeasonalApprovalScore>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal approval scores. Empty fields match all. */
export class SeasonalApprovalScoreQuery {
  name: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minStartsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalApprovalScore): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalApprovalScore[]): SeasonalApprovalScore[] {
    const matched = collections.filter(items, (candidate: SeasonalApprovalScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalApprovalScores(store: SeasonalApprovalScoreStore, query: SeasonalApprovalScoreQuery): SeasonalApprovalScore[] {
  return query.apply(store.list());
}
