import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

/** Keeps lenient suppression thresholds by code. */
export interface LenientSuppressionThresholdStore {
  find(code: string): LenientSuppressionThreshold | undefined;
  save(item: LenientSuppressionThreshold): void;
  remove(code: string): boolean;
  list(): LenientSuppressionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientSuppressionThresholdStore implements LenientSuppressionThresholdStore {
  items: Map<string, LenientSuppressionThreshold>;
  order: string[];

  constructor(items: Map<string, LenientSuppressionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientSuppressionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientSuppressionThreshold): void {
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

  list(): LenientSuppressionThreshold[] {
    const out: LenientSuppressionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientSuppressionThresholdStore(): LenientSuppressionThresholdStore {
  return new MemoryLenientSuppressionThresholdStore(new Map<string, LenientSuppressionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientSuppressionThresholdStore implements LenientSuppressionThresholdStore {
  inner: LenientSuppressionThresholdStore;
  cache: cache.TtlCache<LenientSuppressionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientSuppressionThresholdStore,
    cacheValue: cache.TtlCache<LenientSuppressionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientSuppressionThreshold | undefined {
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

  save(item: LenientSuppressionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientSuppressionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedLenientSuppressionThresholdStore(inner: LenientSuppressionThresholdStore, ttl: number, clockValue: clock.Clock): LenientSuppressionThresholdStore {
  return new CachedLenientSuppressionThresholdStore(
    inner,
    cache.newTtlCache<LenientSuppressionThreshold>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient suppression thresholds. Empty fields match all. */
export class LenientSuppressionThresholdQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientSuppressionThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientSuppressionThreshold[]): LenientSuppressionThreshold[] {
    const matched = collections.filter(items, (candidate: LenientSuppressionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientSuppressionThresholds(store: LenientSuppressionThresholdStore, query: LenientSuppressionThresholdQuery): LenientSuppressionThreshold[] {
  return query.apply(store.list());
}
