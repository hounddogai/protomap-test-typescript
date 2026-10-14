import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyStreakThreshold } from "./legacy-streak-threshold.js";

/** Keeps legacy streak thresholds by code. */
export interface LegacyStreakThresholdStore {
  find(code: string): LegacyStreakThreshold | undefined;
  save(item: LegacyStreakThreshold): void;
  remove(code: string): boolean;
  list(): LegacyStreakThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyStreakThresholdStore implements LegacyStreakThresholdStore {
  items: Map<string, LegacyStreakThreshold>;
  order: string[];

  constructor(items: Map<string, LegacyStreakThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyStreakThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyStreakThreshold): void {
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

  list(): LegacyStreakThreshold[] {
    const out: LegacyStreakThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyStreakThresholdStore(): LegacyStreakThresholdStore {
  return new MemoryLegacyStreakThresholdStore(new Map<string, LegacyStreakThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyStreakThresholdStore implements LegacyStreakThresholdStore {
  inner: LegacyStreakThresholdStore;
  cache: cache.TtlCache<LegacyStreakThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyStreakThresholdStore,
    cacheValue: cache.TtlCache<LegacyStreakThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyStreakThreshold | undefined {
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

  save(item: LegacyStreakThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyStreakThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLegacyStreakThresholdStore(inner: LegacyStreakThresholdStore, ttl: number, clockValue: clock.Clock): LegacyStreakThresholdStore {
  return new CachedLegacyStreakThresholdStore(
    inner,
    cache.newTtlCache<LegacyStreakThreshold>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy streak thresholds. Empty fields match all. */
export class LegacyStreakThresholdQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyStreakThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyStreakThreshold[]): LegacyStreakThreshold[] {
    const matched = collections.filter(items, (candidate: LegacyStreakThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyStreakThresholds(store: LegacyStreakThresholdStore, query: LegacyStreakThresholdQuery): LegacyStreakThreshold[] {
  return query.apply(store.list());
}
