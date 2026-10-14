import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryLeaderboardBundle } from "./primary-leaderboard-bundle.js";

/** Keeps primary leaderboard bundles by code. */
export interface PrimaryLeaderboardBundleStore {
  find(code: string): PrimaryLeaderboardBundle | undefined;
  save(item: PrimaryLeaderboardBundle): void;
  remove(code: string): boolean;
  list(): PrimaryLeaderboardBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryLeaderboardBundleStore implements PrimaryLeaderboardBundleStore {
  items: Map<string, PrimaryLeaderboardBundle>;
  order: string[];

  constructor(items: Map<string, PrimaryLeaderboardBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryLeaderboardBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryLeaderboardBundle): void {
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

  list(): PrimaryLeaderboardBundle[] {
    const out: PrimaryLeaderboardBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryLeaderboardBundleStore(): PrimaryLeaderboardBundleStore {
  return new MemoryPrimaryLeaderboardBundleStore(new Map<string, PrimaryLeaderboardBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryLeaderboardBundleStore implements PrimaryLeaderboardBundleStore {
  inner: PrimaryLeaderboardBundleStore;
  cache: cache.TtlCache<PrimaryLeaderboardBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryLeaderboardBundleStore,
    cacheValue: cache.TtlCache<PrimaryLeaderboardBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryLeaderboardBundle | undefined {
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

  save(item: PrimaryLeaderboardBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryLeaderboardBundle[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryLeaderboardBundleStore(inner: PrimaryLeaderboardBundleStore, ttl: number, clockValue: clock.Clock): PrimaryLeaderboardBundleStore {
  return new CachedPrimaryLeaderboardBundleStore(
    inner,
    cache.newTtlCache<PrimaryLeaderboardBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary leaderboard bundles. Empty fields match all. */
export class PrimaryLeaderboardBundleQuery {
  utmSource: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBatchSize: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryLeaderboardBundle): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryLeaderboardBundle[]): PrimaryLeaderboardBundle[] {
    const matched = collections.filter(items, (candidate: PrimaryLeaderboardBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryLeaderboardBundles(store: PrimaryLeaderboardBundleStore, query: PrimaryLeaderboardBundleQuery): PrimaryLeaderboardBundle[] {
  return query.apply(store.list());
}
