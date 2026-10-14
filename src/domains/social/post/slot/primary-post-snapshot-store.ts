import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPostSnapshot } from "./primary-post-snapshot.js";

/** Keeps primary post snapshots by code. */
export interface PrimaryPostSnapshotStore {
  find(code: string): PrimaryPostSnapshot | undefined;
  save(item: PrimaryPostSnapshot): void;
  remove(code: string): boolean;
  list(): PrimaryPostSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPostSnapshotStore implements PrimaryPostSnapshotStore {
  items: Map<string, PrimaryPostSnapshot>;
  order: string[];

  constructor(items: Map<string, PrimaryPostSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPostSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPostSnapshot): void {
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

  list(): PrimaryPostSnapshot[] {
    const out: PrimaryPostSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPostSnapshotStore(): PrimaryPostSnapshotStore {
  return new MemoryPrimaryPostSnapshotStore(new Map<string, PrimaryPostSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPostSnapshotStore implements PrimaryPostSnapshotStore {
  inner: PrimaryPostSnapshotStore;
  cache: cache.TtlCache<PrimaryPostSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPostSnapshotStore,
    cacheValue: cache.TtlCache<PrimaryPostSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPostSnapshot | undefined {
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

  save(item: PrimaryPostSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPostSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPostSnapshotStore(inner: PrimaryPostSnapshotStore, ttl: number, clockValue: clock.Clock): PrimaryPostSnapshotStore {
  return new CachedPrimaryPostSnapshotStore(inner, cache.newTtlCache<PrimaryPostSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects primary post snapshots. Empty fields match all. */
export class PrimaryPostSnapshotQuery {
  label: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minPriority: number, statuses: string[], limit: number) {
    this.label = label;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPostSnapshot): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPostSnapshot[]): PrimaryPostSnapshot[] {
    const matched = collections.filter(items, (candidate: PrimaryPostSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPostSnapshots(store: PrimaryPostSnapshotStore, query: PrimaryPostSnapshotQuery): PrimaryPostSnapshot[] {
  return query.apply(store.list());
}
