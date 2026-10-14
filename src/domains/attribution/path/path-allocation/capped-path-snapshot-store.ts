import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedPathSnapshot } from "./capped-path-snapshot.js";

/** Keeps capped path snapshots by code. */
export interface CappedPathSnapshotStore {
  find(code: string): CappedPathSnapshot | undefined;
  save(item: CappedPathSnapshot): void;
  remove(code: string): boolean;
  list(): CappedPathSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedPathSnapshotStore implements CappedPathSnapshotStore {
  items: Map<string, CappedPathSnapshot>;
  order: string[];

  constructor(items: Map<string, CappedPathSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedPathSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedPathSnapshot): void {
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

  list(): CappedPathSnapshot[] {
    const out: CappedPathSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedPathSnapshotStore(): CappedPathSnapshotStore {
  return new MemoryCappedPathSnapshotStore(new Map<string, CappedPathSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedPathSnapshotStore implements CappedPathSnapshotStore {
  inner: CappedPathSnapshotStore;
  cache: cache.TtlCache<CappedPathSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedPathSnapshotStore,
    cacheValue: cache.TtlCache<CappedPathSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedPathSnapshot | undefined {
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

  save(item: CappedPathSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedPathSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedCappedPathSnapshotStore(inner: CappedPathSnapshotStore, ttl: number, clockValue: clock.Clock): CappedPathSnapshotStore {
  return new CachedCappedPathSnapshotStore(inner, cache.newTtlCache<CappedPathSnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped path snapshots. Empty fields match all. */
export class CappedPathSnapshotQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedPathSnapshot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedPathSnapshot[]): CappedPathSnapshot[] {
    const matched = collections.filter(items, (candidate: CappedPathSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedPathSnapshots(store: CappedPathSnapshotStore, query: CappedPathSnapshotQuery): CappedPathSnapshot[] {
  return query.apply(store.list());
}
