import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredLeaderboardTemplate } from "./tiered-leaderboard-template.js";

/** Keeps tiered leaderboard templates by code. */
export interface TieredLeaderboardTemplateStore {
  find(code: string): TieredLeaderboardTemplate | undefined;
  save(item: TieredLeaderboardTemplate): void;
  remove(code: string): boolean;
  list(): TieredLeaderboardTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredLeaderboardTemplateStore implements TieredLeaderboardTemplateStore {
  items: Map<string, TieredLeaderboardTemplate>;
  order: string[];

  constructor(items: Map<string, TieredLeaderboardTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredLeaderboardTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredLeaderboardTemplate): void {
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

  list(): TieredLeaderboardTemplate[] {
    const out: TieredLeaderboardTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredLeaderboardTemplateStore(): TieredLeaderboardTemplateStore {
  return new MemoryTieredLeaderboardTemplateStore(new Map<string, TieredLeaderboardTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredLeaderboardTemplateStore implements TieredLeaderboardTemplateStore {
  inner: TieredLeaderboardTemplateStore;
  cache: cache.TtlCache<TieredLeaderboardTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredLeaderboardTemplateStore,
    cacheValue: cache.TtlCache<TieredLeaderboardTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredLeaderboardTemplate | undefined {
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

  save(item: TieredLeaderboardTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredLeaderboardTemplate[] {
    return this.inner.list();
  }
}

export function newCachedTieredLeaderboardTemplateStore(inner: TieredLeaderboardTemplateStore, ttl: number, clockValue: clock.Clock): TieredLeaderboardTemplateStore {
  return new CachedTieredLeaderboardTemplateStore(
    inner,
    cache.newTtlCache<TieredLeaderboardTemplate>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered leaderboard templates. Empty fields match all. */
export class TieredLeaderboardTemplateQuery {
  segment: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRevision: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredLeaderboardTemplate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredLeaderboardTemplate[]): TieredLeaderboardTemplate[] {
    const matched = collections.filter(items, (candidate: TieredLeaderboardTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredLeaderboardTemplates(store: TieredLeaderboardTemplateStore, query: TieredLeaderboardTemplateQuery): TieredLeaderboardTemplate[] {
  return query.apply(store.list());
}
