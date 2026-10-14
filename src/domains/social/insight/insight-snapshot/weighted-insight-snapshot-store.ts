import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

/** Keeps weighted insight snapshots by code. */
export interface WeightedInsightSnapshotStore {
  find(code: string): WeightedInsightSnapshot | undefined;
  save(item: WeightedInsightSnapshot): void;
  remove(code: string): boolean;
  list(): WeightedInsightSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedInsightSnapshotStore implements WeightedInsightSnapshotStore {
  items: Map<string, WeightedInsightSnapshot>;
  order: string[];

  constructor(items: Map<string, WeightedInsightSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedInsightSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedInsightSnapshot): void {
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

  list(): WeightedInsightSnapshot[] {
    const out: WeightedInsightSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedInsightSnapshotStore(): WeightedInsightSnapshotStore {
  return new MemoryWeightedInsightSnapshotStore(new Map<string, WeightedInsightSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedInsightSnapshotStore implements WeightedInsightSnapshotStore {
  inner: WeightedInsightSnapshotStore;
  cache: cache.TtlCache<WeightedInsightSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedInsightSnapshotStore,
    cacheValue: cache.TtlCache<WeightedInsightSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedInsightSnapshot | undefined {
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

  save(item: WeightedInsightSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedInsightSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedWeightedInsightSnapshotStore(inner: WeightedInsightSnapshotStore, ttl: number, clockValue: clock.Clock): WeightedInsightSnapshotStore {
  return new CachedWeightedInsightSnapshotStore(
    inner,
    cache.newTtlCache<WeightedInsightSnapshot>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted insight snapshots. Empty fields match all. */
export class WeightedInsightSnapshotQuery {
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

  matches(item: WeightedInsightSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedInsightSnapshot[]): WeightedInsightSnapshot[] {
    const matched = collections.filter(items, (candidate: WeightedInsightSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedInsightSnapshots(store: WeightedInsightSnapshotStore, query: WeightedInsightSnapshotQuery): WeightedInsightSnapshot[] {
  return query.apply(store.list());
}
