import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightSnapshot } from "./insight-snapshot.js";

/** Keeps insight snapshots by code. */
export interface InsightSnapshotStore {
  find(code: string): InsightSnapshot | undefined;
  save(item: InsightSnapshot): void;
  remove(code: string): boolean;
  list(): InsightSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightSnapshotStore implements InsightSnapshotStore {
  items: Map<string, InsightSnapshot>;
  order: string[];

  constructor(items: Map<string, InsightSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightSnapshot): void {
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

  list(): InsightSnapshot[] {
    const out: InsightSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightSnapshotStore(): InsightSnapshotStore {
  return new MemoryInsightSnapshotStore(new Map<string, InsightSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightSnapshotStore implements InsightSnapshotStore {
  inner: InsightSnapshotStore;
  cache: cache.TtlCache<InsightSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightSnapshotStore,
    cacheValue: cache.TtlCache<InsightSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightSnapshot | undefined {
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

  save(item: InsightSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedInsightSnapshotStore(inner: InsightSnapshotStore, ttl: number, clockValue: clock.Clock): InsightSnapshotStore {
  return new CachedInsightSnapshotStore(inner, cache.newTtlCache<InsightSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects insight snapshots. Empty fields match all. */
export class InsightSnapshotQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightSnapshot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightSnapshot[]): InsightSnapshot[] {
    const matched = collections.filter(items, (candidate: InsightSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightSnapshots(store: InsightSnapshotStore, query: InsightSnapshotQuery): InsightSnapshot[] {
  return query.apply(store.list());
}
