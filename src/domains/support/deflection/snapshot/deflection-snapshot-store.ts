import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionSnapshot } from "./deflection-snapshot.js";

/** Keeps deflection snapshots by code. */
export interface DeflectionSnapshotStore {
  find(code: string): DeflectionSnapshot | undefined;
  save(item: DeflectionSnapshot): void;
  remove(code: string): boolean;
  list(): DeflectionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionSnapshotStore implements DeflectionSnapshotStore {
  items: Map<string, DeflectionSnapshot>;
  order: string[];

  constructor(items: Map<string, DeflectionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionSnapshot): void {
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

  list(): DeflectionSnapshot[] {
    const out: DeflectionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionSnapshotStore(): DeflectionSnapshotStore {
  return new MemoryDeflectionSnapshotStore(new Map<string, DeflectionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionSnapshotStore implements DeflectionSnapshotStore {
  inner: DeflectionSnapshotStore;
  cache: cache.TtlCache<DeflectionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionSnapshotStore,
    cacheValue: cache.TtlCache<DeflectionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionSnapshot | undefined {
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

  save(item: DeflectionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionSnapshotStore(inner: DeflectionSnapshotStore, ttl: number, clockValue: clock.Clock): DeflectionSnapshotStore {
  return new CachedDeflectionSnapshotStore(inner, cache.newTtlCache<DeflectionSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects deflection snapshots. Empty fields match all. */
export class DeflectionSnapshotQuery {
  utmSource: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWindowDays: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionSnapshot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionSnapshot[]): DeflectionSnapshot[] {
    const matched = collections.filter(items, (candidate: DeflectionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionSnapshots(store: DeflectionSnapshotStore, query: DeflectionSnapshotQuery): DeflectionSnapshot[] {
  return query.apply(store.list());
}
