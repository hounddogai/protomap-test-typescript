import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationSnapshot } from "./reputation-snapshot.js";

/** Keeps reputation snapshots by code. */
export interface ReputationSnapshotStore {
  find(code: string): ReputationSnapshot | undefined;
  save(item: ReputationSnapshot): void;
  remove(code: string): boolean;
  list(): ReputationSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationSnapshotStore implements ReputationSnapshotStore {
  items: Map<string, ReputationSnapshot>;
  order: string[];

  constructor(items: Map<string, ReputationSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationSnapshot): void {
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

  list(): ReputationSnapshot[] {
    const out: ReputationSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationSnapshotStore(): ReputationSnapshotStore {
  return new MemoryReputationSnapshotStore(new Map<string, ReputationSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationSnapshotStore implements ReputationSnapshotStore {
  inner: ReputationSnapshotStore;
  cache: cache.TtlCache<ReputationSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationSnapshotStore,
    cacheValue: cache.TtlCache<ReputationSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationSnapshot | undefined {
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

  save(item: ReputationSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedReputationSnapshotStore(inner: ReputationSnapshotStore, ttl: number, clockValue: clock.Clock): ReputationSnapshotStore {
  return new CachedReputationSnapshotStore(inner, cache.newTtlCache<ReputationSnapshot>(128, ttl, clockValue), 0, 0);
}

/** Selects reputation snapshots. Empty fields match all. */
export class ReputationSnapshotQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationSnapshot[]): ReputationSnapshot[] {
    const matched = collections.filter(items, (candidate: ReputationSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationSnapshots(store: ReputationSnapshotStore, query: ReputationSnapshotQuery): ReputationSnapshot[] {
  return query.apply(store.list());
}
