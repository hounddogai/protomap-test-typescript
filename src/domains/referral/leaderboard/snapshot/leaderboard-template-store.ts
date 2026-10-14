import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardTemplate } from "./leaderboard-template.js";

/** Keeps leaderboard templates by code. */
export interface LeaderboardTemplateStore {
  find(code: string): LeaderboardTemplate | undefined;
  save(item: LeaderboardTemplate): void;
  remove(code: string): boolean;
  list(): LeaderboardTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardTemplateStore implements LeaderboardTemplateStore {
  items: Map<string, LeaderboardTemplate>;
  order: string[];

  constructor(items: Map<string, LeaderboardTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardTemplate): void {
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

  list(): LeaderboardTemplate[] {
    const out: LeaderboardTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardTemplateStore(): LeaderboardTemplateStore {
  return new MemoryLeaderboardTemplateStore(new Map<string, LeaderboardTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardTemplateStore implements LeaderboardTemplateStore {
  inner: LeaderboardTemplateStore;
  cache: cache.TtlCache<LeaderboardTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardTemplateStore,
    cacheValue: cache.TtlCache<LeaderboardTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardTemplate | undefined {
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

  save(item: LeaderboardTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardTemplate[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardTemplateStore(inner: LeaderboardTemplateStore, ttl: number, clockValue: clock.Clock): LeaderboardTemplateStore {
  return new CachedLeaderboardTemplateStore(inner, cache.newTtlCache<LeaderboardTemplate>(1024, ttl, clockValue), 0, 0);
}

/** Selects leaderboard templates. Empty fields match all. */
export class LeaderboardTemplateQuery {
  region: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.region = region;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardTemplate): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardTemplate[]): LeaderboardTemplate[] {
    const matched = collections.filter(items, (candidate: LeaderboardTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardTemplates(store: LeaderboardTemplateStore, query: LeaderboardTemplateQuery): LeaderboardTemplate[] {
  return query.apply(store.list());
}
