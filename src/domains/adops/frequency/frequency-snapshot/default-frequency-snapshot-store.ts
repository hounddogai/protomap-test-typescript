import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

/** Keeps default frequency snapshots by code. */
export interface DefaultFrequencySnapshotStore {
  find(code: string): DefaultFrequencySnapshot | undefined;
  save(item: DefaultFrequencySnapshot): void;
  remove(code: string): boolean;
  list(): DefaultFrequencySnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultFrequencySnapshotStore implements DefaultFrequencySnapshotStore {
  items: Map<string, DefaultFrequencySnapshot>;
  order: string[];

  constructor(items: Map<string, DefaultFrequencySnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultFrequencySnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultFrequencySnapshot): void {
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

  list(): DefaultFrequencySnapshot[] {
    const out: DefaultFrequencySnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultFrequencySnapshotStore(): DefaultFrequencySnapshotStore {
  return new MemoryDefaultFrequencySnapshotStore(new Map<string, DefaultFrequencySnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultFrequencySnapshotStore implements DefaultFrequencySnapshotStore {
  inner: DefaultFrequencySnapshotStore;
  cache: cache.TtlCache<DefaultFrequencySnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultFrequencySnapshotStore,
    cacheValue: cache.TtlCache<DefaultFrequencySnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultFrequencySnapshot | undefined {
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

  save(item: DefaultFrequencySnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultFrequencySnapshot[] {
    return this.inner.list();
  }
}

export function newCachedDefaultFrequencySnapshotStore(inner: DefaultFrequencySnapshotStore, ttl: number, clockValue: clock.Clock): DefaultFrequencySnapshotStore {
  return new CachedDefaultFrequencySnapshotStore(
    inner,
    cache.newTtlCache<DefaultFrequencySnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default frequency snapshots. Empty fields match all. */
export class DefaultFrequencySnapshotQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultFrequencySnapshot): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultFrequencySnapshot[]): DefaultFrequencySnapshot[] {
    const matched = collections.filter(items, (candidate: DefaultFrequencySnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultFrequencySnapshots(store: DefaultFrequencySnapshotStore, query: DefaultFrequencySnapshotQuery): DefaultFrequencySnapshot[] {
  return query.apply(store.list());
}
