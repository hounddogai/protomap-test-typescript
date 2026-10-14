import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalBounceScore } from "./regional-bounce-score.js";

/** Keeps regional bounce scores by code. */
export interface RegionalBounceScoreStore {
  find(code: string): RegionalBounceScore | undefined;
  save(item: RegionalBounceScore): void;
  remove(code: string): boolean;
  list(): RegionalBounceScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalBounceScoreStore implements RegionalBounceScoreStore {
  items: Map<string, RegionalBounceScore>;
  order: string[];

  constructor(items: Map<string, RegionalBounceScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalBounceScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalBounceScore): void {
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

  list(): RegionalBounceScore[] {
    const out: RegionalBounceScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalBounceScoreStore(): RegionalBounceScoreStore {
  return new MemoryRegionalBounceScoreStore(new Map<string, RegionalBounceScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalBounceScoreStore implements RegionalBounceScoreStore {
  inner: RegionalBounceScoreStore;
  cache: cache.TtlCache<RegionalBounceScore>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalBounceScoreStore,
    cacheValue: cache.TtlCache<RegionalBounceScore>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalBounceScore | undefined {
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

  save(item: RegionalBounceScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalBounceScore[] {
    return this.inner.list();
  }
}

export function newCachedRegionalBounceScoreStore(inner: RegionalBounceScoreStore, ttl: number, clockValue: clock.Clock): RegionalBounceScoreStore {
  return new CachedRegionalBounceScoreStore(inner, cache.newTtlCache<RegionalBounceScore>(1024, ttl, clockValue), 0, 0);
}

/** Selects regional bounce scores. Empty fields match all. */
export class RegionalBounceScoreQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalBounceScore): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalBounceScore[]): RegionalBounceScore[] {
    const matched = collections.filter(items, (candidate: RegionalBounceScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalBounceScores(store: RegionalBounceScoreStore, query: RegionalBounceScoreQuery): RegionalBounceScore[] {
  return query.apply(store.list());
}
