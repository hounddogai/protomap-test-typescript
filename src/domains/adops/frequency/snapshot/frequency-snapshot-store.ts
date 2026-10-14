import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FrequencySnapshot } from "./frequency-snapshot.js";

/** Keeps frequency snapshots by code. */
export interface FrequencySnapshotStore {
  find(code: string): FrequencySnapshot | undefined;
  save(item: FrequencySnapshot): void;
  remove(code: string): boolean;
  list(): FrequencySnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFrequencySnapshotStore implements FrequencySnapshotStore {
  items: Map<string, FrequencySnapshot>;
  order: string[];

  constructor(items: Map<string, FrequencySnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FrequencySnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FrequencySnapshot): void {
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

  list(): FrequencySnapshot[] {
    const out: FrequencySnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFrequencySnapshotStore(): FrequencySnapshotStore {
  return new MemoryFrequencySnapshotStore(new Map<string, FrequencySnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFrequencySnapshotStore implements FrequencySnapshotStore {
  inner: FrequencySnapshotStore;
  cache: cache.TtlCache<FrequencySnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: FrequencySnapshotStore,
    cacheValue: cache.TtlCache<FrequencySnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FrequencySnapshot | undefined {
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

  save(item: FrequencySnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FrequencySnapshot[] {
    return this.inner.list();
  }
}

export function newCachedFrequencySnapshotStore(inner: FrequencySnapshotStore, ttl: number, clockValue: clock.Clock): FrequencySnapshotStore {
  return new CachedFrequencySnapshotStore(inner, cache.newTtlCache<FrequencySnapshot>(1024, ttl, clockValue), 0, 0);
}

/** Selects frequency snapshots. Empty fields match all. */
export class FrequencySnapshotQuery {
  source: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.source = source;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FrequencySnapshot): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FrequencySnapshot[]): FrequencySnapshot[] {
    const matched = collections.filter(items, (candidate: FrequencySnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFrequencySnapshots(store: FrequencySnapshotStore, query: FrequencySnapshotQuery): FrequencySnapshot[] {
  return query.apply(store.list());
}
