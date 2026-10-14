import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionThreshold } from "./suppression-threshold.js";

/** Keeps suppression thresholds by code. */
export interface SuppressionThresholdStore {
  find(code: string): SuppressionThreshold | undefined;
  save(item: SuppressionThreshold): void;
  remove(code: string): boolean;
  list(): SuppressionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionThresholdStore implements SuppressionThresholdStore {
  items: Map<string, SuppressionThreshold>;
  order: string[];

  constructor(items: Map<string, SuppressionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionThreshold): void {
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

  list(): SuppressionThreshold[] {
    const out: SuppressionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionThresholdStore(): SuppressionThresholdStore {
  return new MemorySuppressionThresholdStore(new Map<string, SuppressionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionThresholdStore implements SuppressionThresholdStore {
  inner: SuppressionThresholdStore;
  cache: cache.TtlCache<SuppressionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionThresholdStore,
    cacheValue: cache.TtlCache<SuppressionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionThreshold | undefined {
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

  save(item: SuppressionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionThresholdStore(inner: SuppressionThresholdStore, ttl: number, clockValue: clock.Clock): SuppressionThresholdStore {
  return new CachedSuppressionThresholdStore(inner, cache.newTtlCache<SuppressionThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects suppression thresholds. Empty fields match all. */
export class SuppressionThresholdQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionThreshold): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionThreshold[]): SuppressionThreshold[] {
    const matched = collections.filter(items, (candidate: SuppressionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionThresholds(store: SuppressionThresholdStore, query: SuppressionThresholdQuery): SuppressionThreshold[] {
  return query.apply(store.list());
}
