import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualPlacementThreshold } from "./manual-placement-threshold.js";

/** Keeps manual placement thresholds by code. */
export interface ManualPlacementThresholdStore {
  find(code: string): ManualPlacementThreshold | undefined;
  save(item: ManualPlacementThreshold): void;
  remove(code: string): boolean;
  list(): ManualPlacementThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualPlacementThresholdStore implements ManualPlacementThresholdStore {
  items: Map<string, ManualPlacementThreshold>;
  order: string[];

  constructor(items: Map<string, ManualPlacementThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualPlacementThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualPlacementThreshold): void {
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

  list(): ManualPlacementThreshold[] {
    const out: ManualPlacementThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualPlacementThresholdStore(): ManualPlacementThresholdStore {
  return new MemoryManualPlacementThresholdStore(new Map<string, ManualPlacementThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualPlacementThresholdStore implements ManualPlacementThresholdStore {
  inner: ManualPlacementThresholdStore;
  cache: cache.TtlCache<ManualPlacementThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualPlacementThresholdStore,
    cacheValue: cache.TtlCache<ManualPlacementThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualPlacementThreshold | undefined {
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

  save(item: ManualPlacementThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualPlacementThreshold[] {
    return this.inner.list();
  }
}

export function newCachedManualPlacementThresholdStore(inner: ManualPlacementThresholdStore, ttl: number, clockValue: clock.Clock): ManualPlacementThresholdStore {
  return new CachedManualPlacementThresholdStore(
    inner,
    cache.newTtlCache<ManualPlacementThreshold>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual placement thresholds. Empty fields match all. */
export class ManualPlacementThresholdQuery {
  unit: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minMaximum: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualPlacementThreshold): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualPlacementThreshold[]): ManualPlacementThreshold[] {
    const matched = collections.filter(items, (candidate: ManualPlacementThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualPlacementThresholds(store: ManualPlacementThresholdStore, query: ManualPlacementThresholdQuery): ManualPlacementThreshold[] {
  return query.apply(store.list());
}
