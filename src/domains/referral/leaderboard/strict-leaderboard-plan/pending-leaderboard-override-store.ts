import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingLeaderboardOverride } from "./pending-leaderboard-override.js";

/** Keeps pending leaderboard overrides by code. */
export interface PendingLeaderboardOverrideStore {
  find(code: string): PendingLeaderboardOverride | undefined;
  save(item: PendingLeaderboardOverride): void;
  remove(code: string): boolean;
  list(): PendingLeaderboardOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingLeaderboardOverrideStore implements PendingLeaderboardOverrideStore {
  items: Map<string, PendingLeaderboardOverride>;
  order: string[];

  constructor(items: Map<string, PendingLeaderboardOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingLeaderboardOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingLeaderboardOverride): void {
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

  list(): PendingLeaderboardOverride[] {
    const out: PendingLeaderboardOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingLeaderboardOverrideStore(): PendingLeaderboardOverrideStore {
  return new MemoryPendingLeaderboardOverrideStore(new Map<string, PendingLeaderboardOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingLeaderboardOverrideStore implements PendingLeaderboardOverrideStore {
  inner: PendingLeaderboardOverrideStore;
  cache: cache.TtlCache<PendingLeaderboardOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingLeaderboardOverrideStore,
    cacheValue: cache.TtlCache<PendingLeaderboardOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingLeaderboardOverride | undefined {
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

  save(item: PendingLeaderboardOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingLeaderboardOverride[] {
    return this.inner.list();
  }
}

export function newCachedPendingLeaderboardOverrideStore(inner: PendingLeaderboardOverrideStore, ttl: number, clockValue: clock.Clock): PendingLeaderboardOverrideStore {
  return new CachedPendingLeaderboardOverrideStore(
    inner,
    cache.newTtlCache<PendingLeaderboardOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending leaderboard overrides. Empty fields match all. */
export class PendingLeaderboardOverrideQuery {
  label: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRatio: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingLeaderboardOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingLeaderboardOverride[]): PendingLeaderboardOverride[] {
    const matched = collections.filter(items, (candidate: PendingLeaderboardOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingLeaderboardOverrides(store: PendingLeaderboardOverrideStore, query: PendingLeaderboardOverrideQuery): PendingLeaderboardOverride[] {
  return query.apply(store.list());
}
