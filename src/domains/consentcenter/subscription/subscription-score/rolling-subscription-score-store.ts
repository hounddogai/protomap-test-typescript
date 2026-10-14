import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSubscriptionScore } from "./rolling-subscription-score.js";

/** Keeps rolling subscription scores by code. */
export interface RollingSubscriptionScoreStore {
  find(code: string): RollingSubscriptionScore | undefined;
  save(item: RollingSubscriptionScore): void;
  remove(code: string): boolean;
  list(): RollingSubscriptionScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSubscriptionScoreStore implements RollingSubscriptionScoreStore {
  items: Map<string, RollingSubscriptionScore>;
  order: string[];

  constructor(items: Map<string, RollingSubscriptionScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSubscriptionScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSubscriptionScore): void {
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

  list(): RollingSubscriptionScore[] {
    const out: RollingSubscriptionScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSubscriptionScoreStore(): RollingSubscriptionScoreStore {
  return new MemoryRollingSubscriptionScoreStore(new Map<string, RollingSubscriptionScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSubscriptionScoreStore implements RollingSubscriptionScoreStore {
  inner: RollingSubscriptionScoreStore;
  cache: cache.TtlCache<RollingSubscriptionScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSubscriptionScoreStore,
    cacheValue: cache.TtlCache<RollingSubscriptionScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSubscriptionScore | undefined {
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

  save(item: RollingSubscriptionScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSubscriptionScore[] {
    return this.inner.list();
  }
}

export function newCachedRollingSubscriptionScoreStore(inner: RollingSubscriptionScoreStore, ttl: number, clockValue: clock.Clock): RollingSubscriptionScoreStore {
  return new CachedRollingSubscriptionScoreStore(
    inner,
    cache.newTtlCache<RollingSubscriptionScore>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling subscription scores. Empty fields match all. */
export class RollingSubscriptionScoreQuery {
  title: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minClicks: number, statuses: string[], limit: number) {
    this.title = title;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSubscriptionScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSubscriptionScore[]): RollingSubscriptionScore[] {
    const matched = collections.filter(items, (candidate: RollingSubscriptionScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSubscriptionScores(store: RollingSubscriptionScoreStore, query: RollingSubscriptionScoreQuery): RollingSubscriptionScore[] {
  return query.apply(store.list());
}
