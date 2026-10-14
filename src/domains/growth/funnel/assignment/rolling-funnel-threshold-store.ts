import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFunnelThreshold } from "./rolling-funnel-threshold.js";

/** Keeps rolling funnel thresholds by code. */
export interface RollingFunnelThresholdStore {
  find(code: string): RollingFunnelThreshold | undefined;
  save(item: RollingFunnelThreshold): void;
  remove(code: string): boolean;
  list(): RollingFunnelThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFunnelThresholdStore implements RollingFunnelThresholdStore {
  items: Map<string, RollingFunnelThreshold>;
  order: string[];

  constructor(items: Map<string, RollingFunnelThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFunnelThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFunnelThreshold): void {
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

  list(): RollingFunnelThreshold[] {
    const out: RollingFunnelThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFunnelThresholdStore(): RollingFunnelThresholdStore {
  return new MemoryRollingFunnelThresholdStore(new Map<string, RollingFunnelThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFunnelThresholdStore implements RollingFunnelThresholdStore {
  inner: RollingFunnelThresholdStore;
  cache: cache.TtlCache<RollingFunnelThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFunnelThresholdStore,
    cacheValue: cache.TtlCache<RollingFunnelThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFunnelThreshold | undefined {
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

  save(item: RollingFunnelThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFunnelThreshold[] {
    return this.inner.list();
  }
}

export function newCachedRollingFunnelThresholdStore(inner: RollingFunnelThresholdStore, ttl: number, clockValue: clock.Clock): RollingFunnelThresholdStore {
  return new CachedRollingFunnelThresholdStore(
    inner,
    cache.newTtlCache<RollingFunnelThreshold>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling funnel thresholds. Empty fields match all. */
export class RollingFunnelThresholdQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFunnelThreshold): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFunnelThreshold[]): RollingFunnelThreshold[] {
    const matched = collections.filter(items, (candidate: RollingFunnelThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFunnelThresholds(store: RollingFunnelThresholdStore, query: RollingFunnelThresholdQuery): RollingFunnelThreshold[] {
  return query.apply(store.list());
}
