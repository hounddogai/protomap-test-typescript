import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutSnapshot } from "./opt-out-snapshot.js";

/** Keeps opt out snapshots by code. */
export interface OptOutSnapshotStore {
  find(code: string): OptOutSnapshot | undefined;
  save(item: OptOutSnapshot): void;
  remove(code: string): boolean;
  list(): OptOutSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutSnapshotStore implements OptOutSnapshotStore {
  items: Map<string, OptOutSnapshot>;
  order: string[];

  constructor(items: Map<string, OptOutSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutSnapshot): void {
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

  list(): OptOutSnapshot[] {
    const out: OptOutSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutSnapshotStore(): OptOutSnapshotStore {
  return new MemoryOptOutSnapshotStore(new Map<string, OptOutSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutSnapshotStore implements OptOutSnapshotStore {
  inner: OptOutSnapshotStore;
  cache: cache.TtlCache<OptOutSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: OptOutSnapshotStore,
    cacheValue: cache.TtlCache<OptOutSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutSnapshot | undefined {
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

  save(item: OptOutSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedOptOutSnapshotStore(inner: OptOutSnapshotStore, ttl: number, clockValue: clock.Clock): OptOutSnapshotStore {
  return new CachedOptOutSnapshotStore(inner, cache.newTtlCache<OptOutSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects opt out snapshots. Empty fields match all. */
export class OptOutSnapshotQuery {
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

  matches(item: OptOutSnapshot): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutSnapshot[]): OptOutSnapshot[] {
    const matched = collections.filter(items, (candidate: OptOutSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutSnapshots(store: OptOutSnapshotStore, query: OptOutSnapshotQuery): OptOutSnapshot[] {
  return query.apply(store.list());
}
