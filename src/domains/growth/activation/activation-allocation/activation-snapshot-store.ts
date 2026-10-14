import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ActivationSnapshot } from "./activation-snapshot.js";

/** Keeps activation snapshots by code. */
export interface ActivationSnapshotStore {
  find(code: string): ActivationSnapshot | undefined;
  save(item: ActivationSnapshot): void;
  remove(code: string): boolean;
  list(): ActivationSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryActivationSnapshotStore implements ActivationSnapshotStore {
  items: Map<string, ActivationSnapshot>;
  order: string[];

  constructor(items: Map<string, ActivationSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ActivationSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ActivationSnapshot): void {
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

  list(): ActivationSnapshot[] {
    const out: ActivationSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryActivationSnapshotStore(): ActivationSnapshotStore {
  return new MemoryActivationSnapshotStore(new Map<string, ActivationSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedActivationSnapshotStore implements ActivationSnapshotStore {
  inner: ActivationSnapshotStore;
  cache: cache.TtlCache<ActivationSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ActivationSnapshotStore,
    cacheValue: cache.TtlCache<ActivationSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ActivationSnapshot | undefined {
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

  save(item: ActivationSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ActivationSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedActivationSnapshotStore(inner: ActivationSnapshotStore, ttl: number, clockValue: clock.Clock): ActivationSnapshotStore {
  return new CachedActivationSnapshotStore(inner, cache.newTtlCache<ActivationSnapshot>(64, ttl, clockValue), 0, 0);
}

/** Selects activation snapshots. Empty fields match all. */
export class ActivationSnapshotQuery {
  title: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minImpressions: number, statuses: string[], limit: number) {
    this.title = title;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ActivationSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ActivationSnapshot[]): ActivationSnapshot[] {
    const matched = collections.filter(items, (candidate: ActivationSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findActivationSnapshots(store: ActivationSnapshotStore, query: ActivationSnapshotQuery): ActivationSnapshot[] {
  return query.apply(store.list());
}
