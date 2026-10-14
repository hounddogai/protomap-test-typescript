import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionSnapshot } from "./scheduled-deflection-snapshot.js";

/** Keeps scheduled deflection snapshots by code. */
export interface ScheduledDeflectionSnapshotStore {
  find(code: string): ScheduledDeflectionSnapshot | undefined;
  save(item: ScheduledDeflectionSnapshot): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionSnapshotStore implements ScheduledDeflectionSnapshotStore {
  items: Map<string, ScheduledDeflectionSnapshot>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionSnapshot): void {
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

  list(): ScheduledDeflectionSnapshot[] {
    const out: ScheduledDeflectionSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionSnapshotStore(): ScheduledDeflectionSnapshotStore {
  return new MemoryScheduledDeflectionSnapshotStore(new Map<string, ScheduledDeflectionSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionSnapshotStore implements ScheduledDeflectionSnapshotStore {
  inner: ScheduledDeflectionSnapshotStore;
  cache: cache.TtlCache<ScheduledDeflectionSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionSnapshotStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionSnapshot | undefined {
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

  save(item: ScheduledDeflectionSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionSnapshotStore(inner: ScheduledDeflectionSnapshotStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionSnapshotStore {
  return new CachedScheduledDeflectionSnapshotStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionSnapshot>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection snapshots. Empty fields match all. */
export class ScheduledDeflectionSnapshotQuery {
  utmSource: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionSnapshot): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionSnapshot[]): ScheduledDeflectionSnapshot[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionSnapshots(store: ScheduledDeflectionSnapshotStore, query: ScheduledDeflectionSnapshotQuery): ScheduledDeflectionSnapshot[] {
  return query.apply(store.list());
}
