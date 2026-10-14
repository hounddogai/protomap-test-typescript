import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

/** Keeps seasonal leaderboard agreements by code. */
export interface SeasonalLeaderboardAgreementStore {
  find(code: string): SeasonalLeaderboardAgreement | undefined;
  save(item: SeasonalLeaderboardAgreement): void;
  remove(code: string): boolean;
  list(): SeasonalLeaderboardAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalLeaderboardAgreementStore implements SeasonalLeaderboardAgreementStore {
  items: Map<string, SeasonalLeaderboardAgreement>;
  order: string[];

  constructor(items: Map<string, SeasonalLeaderboardAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalLeaderboardAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalLeaderboardAgreement): void {
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

  list(): SeasonalLeaderboardAgreement[] {
    const out: SeasonalLeaderboardAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalLeaderboardAgreementStore(): SeasonalLeaderboardAgreementStore {
  return new MemorySeasonalLeaderboardAgreementStore(new Map<string, SeasonalLeaderboardAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalLeaderboardAgreementStore implements SeasonalLeaderboardAgreementStore {
  inner: SeasonalLeaderboardAgreementStore;
  cache: cache.TtlCache<SeasonalLeaderboardAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalLeaderboardAgreementStore,
    cacheValue: cache.TtlCache<SeasonalLeaderboardAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalLeaderboardAgreement | undefined {
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

  save(item: SeasonalLeaderboardAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalLeaderboardAgreement[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalLeaderboardAgreementStore(inner: SeasonalLeaderboardAgreementStore, ttl: number, clockValue: clock.Clock): SeasonalLeaderboardAgreementStore {
  return new CachedSeasonalLeaderboardAgreementStore(
    inner,
    cache.newTtlCache<SeasonalLeaderboardAgreement>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal leaderboard agreements. Empty fields match all. */
export class SeasonalLeaderboardAgreementQuery {
  name: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBatchSize: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalLeaderboardAgreement): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalLeaderboardAgreement[]): SeasonalLeaderboardAgreement[] {
    const matched = collections.filter(items, (candidate: SeasonalLeaderboardAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalLeaderboardAgreements(store: SeasonalLeaderboardAgreementStore, query: SeasonalLeaderboardAgreementQuery): SeasonalLeaderboardAgreement[] {
  return query.apply(store.list());
}
