import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledLeaderboardOverride } from "./scheduled-leaderboard-override.js";

/** Keeps scheduled leaderboard overrides by code. */
export interface ScheduledLeaderboardOverrideStore {
  find(code: string): ScheduledLeaderboardOverride | undefined;
  save(item: ScheduledLeaderboardOverride): void;
  remove(code: string): boolean;
  list(): ScheduledLeaderboardOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledLeaderboardOverrideStore implements ScheduledLeaderboardOverrideStore {
  items: Map<string, ScheduledLeaderboardOverride>;
  order: string[];

  constructor(items: Map<string, ScheduledLeaderboardOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledLeaderboardOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledLeaderboardOverride): void {
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

  list(): ScheduledLeaderboardOverride[] {
    const out: ScheduledLeaderboardOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledLeaderboardOverrideStore(): ScheduledLeaderboardOverrideStore {
  return new MemoryScheduledLeaderboardOverrideStore(new Map<string, ScheduledLeaderboardOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledLeaderboardOverrideStore implements ScheduledLeaderboardOverrideStore {
  inner: ScheduledLeaderboardOverrideStore;
  cache: cache.TtlCache<ScheduledLeaderboardOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledLeaderboardOverrideStore,
    cacheValue: cache.TtlCache<ScheduledLeaderboardOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledLeaderboardOverride | undefined {
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

  save(item: ScheduledLeaderboardOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledLeaderboardOverride[] {
    return this.inner.list();
  }
}

export function newCachedScheduledLeaderboardOverrideStore(inner: ScheduledLeaderboardOverrideStore, ttl: number, clockValue: clock.Clock): ScheduledLeaderboardOverrideStore {
  return new CachedScheduledLeaderboardOverrideStore(
    inner,
    cache.newTtlCache<ScheduledLeaderboardOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled leaderboard overrides. Empty fields match all. */
export class ScheduledLeaderboardOverrideQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledLeaderboardOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledLeaderboardOverride[]): ScheduledLeaderboardOverride[] {
    const matched = collections.filter(items, (candidate: ScheduledLeaderboardOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledLeaderboardOverrides(store: ScheduledLeaderboardOverrideStore, query: ScheduledLeaderboardOverrideQuery): ScheduledLeaderboardOverride[] {
  return query.apply(store.list());
}
