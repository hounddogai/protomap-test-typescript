import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

/** Keeps scheduled leaderboard templates by code. */
export interface ScheduledLeaderboardTemplateStore {
  find(code: string): ScheduledLeaderboardTemplate | undefined;
  save(item: ScheduledLeaderboardTemplate): void;
  remove(code: string): boolean;
  list(): ScheduledLeaderboardTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledLeaderboardTemplateStore implements ScheduledLeaderboardTemplateStore {
  items: Map<string, ScheduledLeaderboardTemplate>;
  order: string[];

  constructor(items: Map<string, ScheduledLeaderboardTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledLeaderboardTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledLeaderboardTemplate): void {
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

  list(): ScheduledLeaderboardTemplate[] {
    const out: ScheduledLeaderboardTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledLeaderboardTemplateStore(): ScheduledLeaderboardTemplateStore {
  return new MemoryScheduledLeaderboardTemplateStore(new Map<string, ScheduledLeaderboardTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledLeaderboardTemplateStore implements ScheduledLeaderboardTemplateStore {
  inner: ScheduledLeaderboardTemplateStore;
  cache: cache.TtlCache<ScheduledLeaderboardTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledLeaderboardTemplateStore,
    cacheValue: cache.TtlCache<ScheduledLeaderboardTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledLeaderboardTemplate | undefined {
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

  save(item: ScheduledLeaderboardTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledLeaderboardTemplate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledLeaderboardTemplateStore(inner: ScheduledLeaderboardTemplateStore, ttl: number, clockValue: clock.Clock): ScheduledLeaderboardTemplateStore {
  return new CachedScheduledLeaderboardTemplateStore(
    inner,
    cache.newTtlCache<ScheduledLeaderboardTemplate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled leaderboard templates. Empty fields match all. */
export class ScheduledLeaderboardTemplateQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledLeaderboardTemplate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledLeaderboardTemplate[]): ScheduledLeaderboardTemplate[] {
    const matched = collections.filter(items, (candidate: ScheduledLeaderboardTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledLeaderboardTemplates(store: ScheduledLeaderboardTemplateStore, query: ScheduledLeaderboardTemplateQuery): ScheduledLeaderboardTemplate[] {
  return query.apply(store.list());
}
