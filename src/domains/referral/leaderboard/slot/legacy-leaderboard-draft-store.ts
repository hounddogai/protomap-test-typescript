import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyLeaderboardDraft } from "./legacy-leaderboard-draft.js";

/** Keeps legacy leaderboard drafts by code. */
export interface LegacyLeaderboardDraftStore {
  find(code: string): LegacyLeaderboardDraft | undefined;
  save(item: LegacyLeaderboardDraft): void;
  remove(code: string): boolean;
  list(): LegacyLeaderboardDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyLeaderboardDraftStore implements LegacyLeaderboardDraftStore {
  items: Map<string, LegacyLeaderboardDraft>;
  order: string[];

  constructor(items: Map<string, LegacyLeaderboardDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyLeaderboardDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyLeaderboardDraft): void {
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

  list(): LegacyLeaderboardDraft[] {
    const out: LegacyLeaderboardDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyLeaderboardDraftStore(): LegacyLeaderboardDraftStore {
  return new MemoryLegacyLeaderboardDraftStore(new Map<string, LegacyLeaderboardDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyLeaderboardDraftStore implements LegacyLeaderboardDraftStore {
  inner: LegacyLeaderboardDraftStore;
  cache: cache.TtlCache<LegacyLeaderboardDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyLeaderboardDraftStore,
    cacheValue: cache.TtlCache<LegacyLeaderboardDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyLeaderboardDraft | undefined {
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

  save(item: LegacyLeaderboardDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyLeaderboardDraft[] {
    return this.inner.list();
  }
}

export function newCachedLegacyLeaderboardDraftStore(inner: LegacyLeaderboardDraftStore, ttl: number, clockValue: clock.Clock): LegacyLeaderboardDraftStore {
  return new CachedLegacyLeaderboardDraftStore(
    inner,
    cache.newTtlCache<LegacyLeaderboardDraft>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy leaderboard drafts. Empty fields match all. */
export class LegacyLeaderboardDraftQuery {
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

  matches(item: LegacyLeaderboardDraft): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyLeaderboardDraft[]): LegacyLeaderboardDraft[] {
    const matched = collections.filter(items, (candidate: LegacyLeaderboardDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyLeaderboardDrafts(store: LegacyLeaderboardDraftStore, query: LegacyLeaderboardDraftQuery): LegacyLeaderboardDraft[] {
  return query.apply(store.list());
}
