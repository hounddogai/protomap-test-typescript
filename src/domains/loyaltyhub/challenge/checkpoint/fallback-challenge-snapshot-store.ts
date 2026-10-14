import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

/** Keeps fallback challenge snapshots by code. */
export interface FallbackChallengeSnapshotStore {
  find(code: string): FallbackChallengeSnapshot | undefined;
  save(item: FallbackChallengeSnapshot): void;
  remove(code: string): boolean;
  list(): FallbackChallengeSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackChallengeSnapshotStore implements FallbackChallengeSnapshotStore {
  items: Map<string, FallbackChallengeSnapshot>;
  order: string[];

  constructor(items: Map<string, FallbackChallengeSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackChallengeSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackChallengeSnapshot): void {
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

  list(): FallbackChallengeSnapshot[] {
    const out: FallbackChallengeSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackChallengeSnapshotStore(): FallbackChallengeSnapshotStore {
  return new MemoryFallbackChallengeSnapshotStore(new Map<string, FallbackChallengeSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackChallengeSnapshotStore implements FallbackChallengeSnapshotStore {
  inner: FallbackChallengeSnapshotStore;
  cache: cache.TtlCache<FallbackChallengeSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackChallengeSnapshotStore,
    cacheValue: cache.TtlCache<FallbackChallengeSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackChallengeSnapshot | undefined {
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

  save(item: FallbackChallengeSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackChallengeSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedFallbackChallengeSnapshotStore(inner: FallbackChallengeSnapshotStore, ttl: number, clockValue: clock.Clock): FallbackChallengeSnapshotStore {
  return new CachedFallbackChallengeSnapshotStore(
    inner,
    cache.newTtlCache<FallbackChallengeSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback challenge snapshots. Empty fields match all. */
export class FallbackChallengeSnapshotQuery {
  country: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minScore: number, statuses: string[], limit: number) {
    this.country = country;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackChallengeSnapshot): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackChallengeSnapshot[]): FallbackChallengeSnapshot[] {
    const matched = collections.filter(items, (candidate: FallbackChallengeSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackChallengeSnapshots(store: FallbackChallengeSnapshotStore, query: FallbackChallengeSnapshotQuery): FallbackChallengeSnapshot[] {
  return query.apply(store.list());
}
