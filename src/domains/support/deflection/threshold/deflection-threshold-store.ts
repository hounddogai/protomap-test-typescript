import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionThreshold } from "./deflection-threshold.js";

/** Keeps deflection thresholds by code. */
export interface DeflectionThresholdStore {
  find(code: string): DeflectionThreshold | undefined;
  save(item: DeflectionThreshold): void;
  remove(code: string): boolean;
  list(): DeflectionThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionThresholdStore implements DeflectionThresholdStore {
  items: Map<string, DeflectionThreshold>;
  order: string[];

  constructor(items: Map<string, DeflectionThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionThreshold): void {
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

  list(): DeflectionThreshold[] {
    const out: DeflectionThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionThresholdStore(): DeflectionThresholdStore {
  return new MemoryDeflectionThresholdStore(new Map<string, DeflectionThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionThresholdStore implements DeflectionThresholdStore {
  inner: DeflectionThresholdStore;
  cache: cache.TtlCache<DeflectionThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionThresholdStore,
    cacheValue: cache.TtlCache<DeflectionThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionThreshold | undefined {
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

  save(item: DeflectionThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionThreshold[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionThresholdStore(inner: DeflectionThresholdStore, ttl: number, clockValue: clock.Clock): DeflectionThresholdStore {
  return new CachedDeflectionThresholdStore(inner, cache.newTtlCache<DeflectionThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection thresholds. Empty fields match all. */
export class DeflectionThresholdQuery {
  segment: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minPriority: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionThreshold): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionThreshold[]): DeflectionThreshold[] {
    const matched = collections.filter(items, (candidate: DeflectionThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionThresholds(store: DeflectionThresholdStore, query: DeflectionThresholdQuery): DeflectionThreshold[] {
  return query.apply(store.list());
}
