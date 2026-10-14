import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingSlaThreshold } from "./rolling-sla-threshold.js";

/** Keeps rolling sla thresholds by code. */
export interface RollingSlaThresholdStore {
  find(code: string): RollingSlaThreshold | undefined;
  save(item: RollingSlaThreshold): void;
  remove(code: string): boolean;
  list(): RollingSlaThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingSlaThresholdStore implements RollingSlaThresholdStore {
  items: Map<string, RollingSlaThreshold>;
  order: string[];

  constructor(items: Map<string, RollingSlaThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingSlaThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingSlaThreshold): void {
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

  list(): RollingSlaThreshold[] {
    const out: RollingSlaThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingSlaThresholdStore(): RollingSlaThresholdStore {
  return new MemoryRollingSlaThresholdStore(new Map<string, RollingSlaThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingSlaThresholdStore implements RollingSlaThresholdStore {
  inner: RollingSlaThresholdStore;
  cache: cache.TtlCache<RollingSlaThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingSlaThresholdStore,
    cacheValue: cache.TtlCache<RollingSlaThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingSlaThreshold | undefined {
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

  save(item: RollingSlaThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingSlaThreshold[] {
    return this.inner.list();
  }
}

export function newCachedRollingSlaThresholdStore(inner: RollingSlaThresholdStore, ttl: number, clockValue: clock.Clock): RollingSlaThresholdStore {
  return new CachedRollingSlaThresholdStore(inner, cache.newTtlCache<RollingSlaThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects rolling sla thresholds. Empty fields match all. */
export class RollingSlaThresholdQuery {
  category: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingSlaThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingSlaThreshold[]): RollingSlaThreshold[] {
    const matched = collections.filter(items, (candidate: RollingSlaThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingSlaThresholds(store: RollingSlaThresholdStore, query: RollingSlaThresholdQuery): RollingSlaThreshold[] {
  return query.apply(store.list());
}
