import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

/** Keeps fallback flight snapshots by code. */
export interface FallbackFlightSnapshotStore {
  find(code: string): FallbackFlightSnapshot | undefined;
  save(item: FallbackFlightSnapshot): void;
  remove(code: string): boolean;
  list(): FallbackFlightSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackFlightSnapshotStore implements FallbackFlightSnapshotStore {
  items: Map<string, FallbackFlightSnapshot>;
  order: string[];

  constructor(items: Map<string, FallbackFlightSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackFlightSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackFlightSnapshot): void {
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

  list(): FallbackFlightSnapshot[] {
    const out: FallbackFlightSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackFlightSnapshotStore(): FallbackFlightSnapshotStore {
  return new MemoryFallbackFlightSnapshotStore(new Map<string, FallbackFlightSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackFlightSnapshotStore implements FallbackFlightSnapshotStore {
  inner: FallbackFlightSnapshotStore;
  cache: cache.TtlCache<FallbackFlightSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackFlightSnapshotStore,
    cacheValue: cache.TtlCache<FallbackFlightSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackFlightSnapshot | undefined {
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

  save(item: FallbackFlightSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackFlightSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackFlightSnapshotStore(inner: FallbackFlightSnapshotStore, ttl: number, clockValue: clock.Clock): FallbackFlightSnapshotStore {
  return new CachedFallbackFlightSnapshotStore(
    inner,
    cache.newTtlCache<FallbackFlightSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback flight snapshots. Empty fields match all. */
export class FallbackFlightSnapshotQuery {
  category: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMaximum: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackFlightSnapshot): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackFlightSnapshot[]): FallbackFlightSnapshot[] {
    const matched = collections.filter(items, (candidate: FallbackFlightSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackFlightSnapshots(store: FallbackFlightSnapshotStore, query: FallbackFlightSnapshotQuery): FallbackFlightSnapshot[] {
  return query.apply(store.list());
}
