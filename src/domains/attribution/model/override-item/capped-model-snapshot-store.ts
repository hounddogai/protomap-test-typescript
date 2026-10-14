import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedModelSnapshot } from "./capped-model-snapshot.js";

/** Keeps capped model snapshots by code. */
export interface CappedModelSnapshotStore {
  find(code: string): CappedModelSnapshot | undefined;
  save(item: CappedModelSnapshot): void;
  remove(code: string): boolean;
  list(): CappedModelSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedModelSnapshotStore implements CappedModelSnapshotStore {
  items: Map<string, CappedModelSnapshot>;
  order: string[];

  constructor(items: Map<string, CappedModelSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedModelSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedModelSnapshot): void {
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

  list(): CappedModelSnapshot[] {
    const out: CappedModelSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedModelSnapshotStore(): CappedModelSnapshotStore {
  return new MemoryCappedModelSnapshotStore(new Map<string, CappedModelSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedModelSnapshotStore implements CappedModelSnapshotStore {
  inner: CappedModelSnapshotStore;
  cache: cache.TtlCache<CappedModelSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedModelSnapshotStore,
    cacheValue: cache.TtlCache<CappedModelSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedModelSnapshot | undefined {
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

  save(item: CappedModelSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedModelSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCappedModelSnapshotStore(inner: CappedModelSnapshotStore, ttl: number, clockValue: clock.Clock): CappedModelSnapshotStore {
  return new CachedCappedModelSnapshotStore(inner, cache.newTtlCache<CappedModelSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects capped model snapshots. Empty fields match all. */
export class CappedModelSnapshotQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedModelSnapshot): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedModelSnapshot[]): CappedModelSnapshot[] {
    const matched = collections.filter(items, (candidate: CappedModelSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedModelSnapshots(store: CappedModelSnapshotStore, query: CappedModelSnapshotQuery): CappedModelSnapshot[] {
  return query.apply(store.list());
}
