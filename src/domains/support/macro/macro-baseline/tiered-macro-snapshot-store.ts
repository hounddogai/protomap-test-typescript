import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredMacroSnapshot } from "./tiered-macro-snapshot.js";

/** Keeps tiered macro snapshots by code. */
export interface TieredMacroSnapshotStore {
  find(code: string): TieredMacroSnapshot | undefined;
  save(item: TieredMacroSnapshot): void;
  remove(code: string): boolean;
  list(): TieredMacroSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredMacroSnapshotStore implements TieredMacroSnapshotStore {
  items: Map<string, TieredMacroSnapshot>;
  order: string[];

  constructor(items: Map<string, TieredMacroSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredMacroSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredMacroSnapshot): void {
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

  list(): TieredMacroSnapshot[] {
    const out: TieredMacroSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredMacroSnapshotStore(): TieredMacroSnapshotStore {
  return new MemoryTieredMacroSnapshotStore(new Map<string, TieredMacroSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredMacroSnapshotStore implements TieredMacroSnapshotStore {
  inner: TieredMacroSnapshotStore;
  cache: cache.TtlCache<TieredMacroSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredMacroSnapshotStore,
    cacheValue: cache.TtlCache<TieredMacroSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredMacroSnapshot | undefined {
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

  save(item: TieredMacroSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredMacroSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedTieredMacroSnapshotStore(inner: TieredMacroSnapshotStore, ttl: number, clockValue: clock.Clock): TieredMacroSnapshotStore {
  return new CachedTieredMacroSnapshotStore(inner, cache.newTtlCache<TieredMacroSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered macro snapshots. Empty fields match all. */
export class TieredMacroSnapshotQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredMacroSnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredMacroSnapshot[]): TieredMacroSnapshot[] {
    const matched = collections.filter(items, (candidate: TieredMacroSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredMacroSnapshots(store: TieredMacroSnapshotStore, query: TieredMacroSnapshotQuery): TieredMacroSnapshot[] {
  return query.apply(store.list());
}
