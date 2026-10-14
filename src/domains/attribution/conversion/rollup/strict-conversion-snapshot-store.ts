import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictConversionSnapshot } from "./strict-conversion-snapshot.js";

/** Keeps strict conversion snapshots by code. */
export interface StrictConversionSnapshotStore {
  find(code: string): StrictConversionSnapshot | undefined;
  save(item: StrictConversionSnapshot): void;
  remove(code: string): boolean;
  list(): StrictConversionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictConversionSnapshotStore implements StrictConversionSnapshotStore {
  items: Map<string, StrictConversionSnapshot>;
  order: string[];

  constructor(items: Map<string, StrictConversionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictConversionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictConversionSnapshot): void {
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

  list(): StrictConversionSnapshot[] {
    const out: StrictConversionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictConversionSnapshotStore(): StrictConversionSnapshotStore {
  return new MemoryStrictConversionSnapshotStore(new Map<string, StrictConversionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictConversionSnapshotStore implements StrictConversionSnapshotStore {
  inner: StrictConversionSnapshotStore;
  cache: cache.TtlCache<StrictConversionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictConversionSnapshotStore,
    cacheValue: cache.TtlCache<StrictConversionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictConversionSnapshot | undefined {
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

  save(item: StrictConversionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictConversionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedStrictConversionSnapshotStore(inner: StrictConversionSnapshotStore, ttl: number, clockValue: clock.Clock): StrictConversionSnapshotStore {
  return new CachedStrictConversionSnapshotStore(
    inner,
    cache.newTtlCache<StrictConversionSnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict conversion snapshots. Empty fields match all. */
export class StrictConversionSnapshotQuery {
  channel: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minGraceDays: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictConversionSnapshot): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictConversionSnapshot[]): StrictConversionSnapshot[] {
    const matched = collections.filter(items, (candidate: StrictConversionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictConversionSnapshots(store: StrictConversionSnapshotStore, query: StrictConversionSnapshotQuery): StrictConversionSnapshot[] {
  return query.apply(store.list());
}
