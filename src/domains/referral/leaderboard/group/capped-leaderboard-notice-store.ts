import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

/** Keeps capped leaderboard notices by code. */
export interface CappedLeaderboardNoticeStore {
  find(code: string): CappedLeaderboardNotice | undefined;
  save(item: CappedLeaderboardNotice): void;
  remove(code: string): boolean;
  list(): CappedLeaderboardNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedLeaderboardNoticeStore implements CappedLeaderboardNoticeStore {
  items: Map<string, CappedLeaderboardNotice>;
  order: string[];

  constructor(items: Map<string, CappedLeaderboardNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedLeaderboardNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedLeaderboardNotice): void {
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

  list(): CappedLeaderboardNotice[] {
    const out: CappedLeaderboardNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedLeaderboardNoticeStore(): CappedLeaderboardNoticeStore {
  return new MemoryCappedLeaderboardNoticeStore(new Map<string, CappedLeaderboardNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedLeaderboardNoticeStore implements CappedLeaderboardNoticeStore {
  inner: CappedLeaderboardNoticeStore;
  cache: cache.TtlCache<CappedLeaderboardNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedLeaderboardNoticeStore,
    cacheValue: cache.TtlCache<CappedLeaderboardNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedLeaderboardNotice | undefined {
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

  save(item: CappedLeaderboardNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedLeaderboardNotice[] {
    return this.inner.list();
  }
}

export function newCachedCappedLeaderboardNoticeStore(inner: CappedLeaderboardNoticeStore, ttl: number, clockValue: clock.Clock): CappedLeaderboardNoticeStore {
  return new CachedCappedLeaderboardNoticeStore(
    inner,
    cache.newTtlCache<CappedLeaderboardNotice>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped leaderboard notices. Empty fields match all. */
export class CappedLeaderboardNoticeQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedLeaderboardNotice): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedLeaderboardNotice[]): CappedLeaderboardNotice[] {
    const matched = collections.filter(items, (candidate: CappedLeaderboardNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedLeaderboardNotices(store: CappedLeaderboardNoticeStore, query: CappedLeaderboardNoticeQuery): CappedLeaderboardNotice[] {
  return query.apply(store.list());
}
