import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

/** Keeps global challenge snapshots by code. */
export interface GlobalChallengeSnapshotStore {
  find(code: string): GlobalChallengeSnapshot | undefined;
  save(item: GlobalChallengeSnapshot): void;
  remove(code: string): boolean;
  list(): GlobalChallengeSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalChallengeSnapshotStore implements GlobalChallengeSnapshotStore {
  items: Map<string, GlobalChallengeSnapshot>;
  order: string[];

  constructor(items: Map<string, GlobalChallengeSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalChallengeSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalChallengeSnapshot): void {
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

  list(): GlobalChallengeSnapshot[] {
    const out: GlobalChallengeSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalChallengeSnapshotStore(): GlobalChallengeSnapshotStore {
  return new MemoryGlobalChallengeSnapshotStore(new Map<string, GlobalChallengeSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalChallengeSnapshotStore implements GlobalChallengeSnapshotStore {
  inner: GlobalChallengeSnapshotStore;
  cache: cache.TtlCache<GlobalChallengeSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalChallengeSnapshotStore,
    cacheValue: cache.TtlCache<GlobalChallengeSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalChallengeSnapshot | undefined {
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

  save(item: GlobalChallengeSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalChallengeSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedGlobalChallengeSnapshotStore(inner: GlobalChallengeSnapshotStore, ttl: number, clockValue: clock.Clock): GlobalChallengeSnapshotStore {
  return new CachedGlobalChallengeSnapshotStore(
    inner,
    cache.newTtlCache<GlobalChallengeSnapshot>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global challenge snapshots. Empty fields match all. */
export class GlobalChallengeSnapshotQuery {
  country: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBid: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalChallengeSnapshot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalChallengeSnapshot[]): GlobalChallengeSnapshot[] {
    const matched = collections.filter(items, (candidate: GlobalChallengeSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalChallengeSnapshots(store: GlobalChallengeSnapshotStore, query: GlobalChallengeSnapshotQuery): GlobalChallengeSnapshot[] {
  return query.apply(store.list());
}
