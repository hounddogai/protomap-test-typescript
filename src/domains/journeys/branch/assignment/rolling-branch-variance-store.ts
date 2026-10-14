import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingBranchVariance } from "./rolling-branch-variance.js";

/** Keeps rolling branch variances by code. */
export interface RollingBranchVarianceStore {
  find(code: string): RollingBranchVariance | undefined;
  save(item: RollingBranchVariance): void;
  remove(code: string): boolean;
  list(): RollingBranchVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingBranchVarianceStore implements RollingBranchVarianceStore {
  items: Map<string, RollingBranchVariance>;
  order: string[];

  constructor(items: Map<string, RollingBranchVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingBranchVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingBranchVariance): void {
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

  list(): RollingBranchVariance[] {
    const out: RollingBranchVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingBranchVarianceStore(): RollingBranchVarianceStore {
  return new MemoryRollingBranchVarianceStore(new Map<string, RollingBranchVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingBranchVarianceStore implements RollingBranchVarianceStore {
  inner: RollingBranchVarianceStore;
  cache: cache.TtlCache<RollingBranchVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingBranchVarianceStore,
    cacheValue: cache.TtlCache<RollingBranchVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingBranchVariance | undefined {
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

  save(item: RollingBranchVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingBranchVariance[] {
    return this.inner.list();
  }
}

export function newCachedRollingBranchVarianceStore(inner: RollingBranchVarianceStore, ttl: number, clockValue: clock.Clock): RollingBranchVarianceStore {
  return new CachedRollingBranchVarianceStore(
    inner,
    cache.newTtlCache<RollingBranchVariance>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling branch variances. Empty fields match all. */
export class RollingBranchVarianceQuery {
  channel: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minStartsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingBranchVariance): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingBranchVariance[]): RollingBranchVariance[] {
    const matched = collections.filter(items, (candidate: RollingBranchVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingBranchVariances(store: RollingBranchVarianceStore, query: RollingBranchVarianceQuery): RollingBranchVariance[] {
  return query.apply(store.list());
}
