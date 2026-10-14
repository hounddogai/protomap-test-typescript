import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakThreshold } from "./streak-threshold.js";

/** Keeps streak thresholds by code. */
export interface StreakThresholdStore {
  find(code: string): StreakThreshold | undefined;
  save(item: StreakThreshold): void;
  remove(code: string): boolean;
  list(): StreakThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakThresholdStore implements StreakThresholdStore {
  items: Map<string, StreakThreshold>;
  order: string[];

  constructor(items: Map<string, StreakThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakThreshold): void {
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

  list(): StreakThreshold[] {
    const out: StreakThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakThresholdStore(): StreakThresholdStore {
  return new MemoryStreakThresholdStore(new Map<string, StreakThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakThresholdStore implements StreakThresholdStore {
  inner: StreakThresholdStore;
  cache: cache.TtlCache<StreakThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: StreakThresholdStore,
    cacheValue: cache.TtlCache<StreakThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakThreshold | undefined {
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

  save(item: StreakThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakThreshold[] {
    return this.inner.list();
  }
}

export function newCachedStreakThresholdStore(inner: StreakThresholdStore, ttl: number, clockValue: clock.Clock): StreakThresholdStore {
  return new CachedStreakThresholdStore(inner, cache.newTtlCache<StreakThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects streak thresholds. Empty fields match all. */
export class StreakThresholdQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakThreshold[]): StreakThreshold[] {
    const matched = collections.filter(items, (candidate: StreakThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakThresholds(store: StreakThresholdStore, query: StreakThresholdQuery): StreakThreshold[] {
  return query.apply(store.list());
}
