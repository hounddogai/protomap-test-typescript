import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultChallengeVariance } from "./default-challenge-variance.js";

/** Keeps default challenge variances by code. */
export interface DefaultChallengeVarianceStore {
  find(code: string): DefaultChallengeVariance | undefined;
  save(item: DefaultChallengeVariance): void;
  remove(code: string): boolean;
  list(): DefaultChallengeVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultChallengeVarianceStore implements DefaultChallengeVarianceStore {
  items: Map<string, DefaultChallengeVariance>;
  order: string[];

  constructor(items: Map<string, DefaultChallengeVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultChallengeVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultChallengeVariance): void {
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

  list(): DefaultChallengeVariance[] {
    const out: DefaultChallengeVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultChallengeVarianceStore(): DefaultChallengeVarianceStore {
  return new MemoryDefaultChallengeVarianceStore(new Map<string, DefaultChallengeVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultChallengeVarianceStore implements DefaultChallengeVarianceStore {
  inner: DefaultChallengeVarianceStore;
  cache: cache.TtlCache<DefaultChallengeVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultChallengeVarianceStore,
    cacheValue: cache.TtlCache<DefaultChallengeVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultChallengeVariance | undefined {
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

  save(item: DefaultChallengeVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultChallengeVariance[] {
    return this.inner.list();
  }
}

export function newCachedDefaultChallengeVarianceStore(inner: DefaultChallengeVarianceStore, ttl: number, clockValue: clock.Clock): DefaultChallengeVarianceStore {
  return new CachedDefaultChallengeVarianceStore(
    inner,
    cache.newTtlCache<DefaultChallengeVariance>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default challenge variances. Empty fields match all. */
export class DefaultChallengeVarianceQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultChallengeVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultChallengeVariance[]): DefaultChallengeVariance[] {
    const matched = collections.filter(items, (candidate: DefaultChallengeVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultChallengeVariances(store: DefaultChallengeVarianceStore, query: DefaultChallengeVarianceQuery): DefaultChallengeVariance[] {
  return query.apply(store.list());
}
