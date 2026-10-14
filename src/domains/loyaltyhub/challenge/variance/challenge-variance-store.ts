import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeVariance } from "./challenge-variance.js";

/** Keeps challenge variances by code. */
export interface ChallengeVarianceStore {
  find(code: string): ChallengeVariance | undefined;
  save(item: ChallengeVariance): void;
  remove(code: string): boolean;
  list(): ChallengeVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeVarianceStore implements ChallengeVarianceStore {
  items: Map<string, ChallengeVariance>;
  order: string[];

  constructor(items: Map<string, ChallengeVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeVariance): void {
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

  list(): ChallengeVariance[] {
    const out: ChallengeVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeVarianceStore(): ChallengeVarianceStore {
  return new MemoryChallengeVarianceStore(new Map<string, ChallengeVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeVarianceStore implements ChallengeVarianceStore {
  inner: ChallengeVarianceStore;
  cache: cache.TtlCache<ChallengeVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeVarianceStore,
    cacheValue: cache.TtlCache<ChallengeVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeVariance | undefined {
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

  save(item: ChallengeVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeVariance[] {
    return this.inner.list();
  }
}

export function newCachedChallengeVarianceStore(inner: ChallengeVarianceStore, ttl: number, clockValue: clock.Clock): ChallengeVarianceStore {
  return new CachedChallengeVarianceStore(inner, cache.newTtlCache<ChallengeVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects challenge variances. Empty fields match all. */
export class ChallengeVarianceQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeVariance[]): ChallengeVariance[] {
    const matched = collections.filter(items, (candidate: ChallengeVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeVariances(store: ChallengeVarianceStore, query: ChallengeVarianceQuery): ChallengeVariance[] {
  return query.apply(store.list());
}
