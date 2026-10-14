import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardAgreement } from "./leaderboard-agreement.js";

/** Keeps leaderboard agreements by code. */
export interface LeaderboardAgreementStore {
  find(code: string): LeaderboardAgreement | undefined;
  save(item: LeaderboardAgreement): void;
  remove(code: string): boolean;
  list(): LeaderboardAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardAgreementStore implements LeaderboardAgreementStore {
  items: Map<string, LeaderboardAgreement>;
  order: string[];

  constructor(items: Map<string, LeaderboardAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardAgreement): void {
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

  list(): LeaderboardAgreement[] {
    const out: LeaderboardAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardAgreementStore(): LeaderboardAgreementStore {
  return new MemoryLeaderboardAgreementStore(new Map<string, LeaderboardAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardAgreementStore implements LeaderboardAgreementStore {
  inner: LeaderboardAgreementStore;
  cache: cache.TtlCache<LeaderboardAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardAgreementStore,
    cacheValue: cache.TtlCache<LeaderboardAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardAgreement | undefined {
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

  save(item: LeaderboardAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardAgreement[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardAgreementStore(inner: LeaderboardAgreementStore, ttl: number, clockValue: clock.Clock): LeaderboardAgreementStore {
  return new CachedLeaderboardAgreementStore(
    inner,
    cache.newTtlCache<LeaderboardAgreement>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects leaderboard agreements. Empty fields match all. */
export class LeaderboardAgreementQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardAgreement): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardAgreement[]): LeaderboardAgreement[] {
    const matched = collections.filter(items, (candidate: LeaderboardAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardAgreements(store: LeaderboardAgreementStore, query: LeaderboardAgreementQuery): LeaderboardAgreement[] {
  return query.apply(store.list());
}
