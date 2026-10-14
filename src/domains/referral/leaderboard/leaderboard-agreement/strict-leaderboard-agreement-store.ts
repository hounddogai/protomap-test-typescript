import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

/** Keeps strict leaderboard agreements by code. */
export interface StrictLeaderboardAgreementStore {
  find(code: string): StrictLeaderboardAgreement | undefined;
  save(item: StrictLeaderboardAgreement): void;
  remove(code: string): boolean;
  list(): StrictLeaderboardAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictLeaderboardAgreementStore implements StrictLeaderboardAgreementStore {
  items: Map<string, StrictLeaderboardAgreement>;
  order: string[];

  constructor(items: Map<string, StrictLeaderboardAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictLeaderboardAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictLeaderboardAgreement): void {
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

  list(): StrictLeaderboardAgreement[] {
    const out: StrictLeaderboardAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictLeaderboardAgreementStore(): StrictLeaderboardAgreementStore {
  return new MemoryStrictLeaderboardAgreementStore(new Map<string, StrictLeaderboardAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictLeaderboardAgreementStore implements StrictLeaderboardAgreementStore {
  inner: StrictLeaderboardAgreementStore;
  cache: cache.TtlCache<StrictLeaderboardAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictLeaderboardAgreementStore,
    cacheValue: cache.TtlCache<StrictLeaderboardAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictLeaderboardAgreement | undefined {
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

  save(item: StrictLeaderboardAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictLeaderboardAgreement[] {
    return this.inner.list();
  }
}

export function newCachedStrictLeaderboardAgreementStore(inner: StrictLeaderboardAgreementStore, ttl: number, clockValue: clock.Clock): StrictLeaderboardAgreementStore {
  return new CachedStrictLeaderboardAgreementStore(
    inner,
    cache.newTtlCache<StrictLeaderboardAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict leaderboard agreements. Empty fields match all. */
export class StrictLeaderboardAgreementQuery {
  label: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictLeaderboardAgreement): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictLeaderboardAgreement[]): StrictLeaderboardAgreement[] {
    const matched = collections.filter(items, (candidate: StrictLeaderboardAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictLeaderboardAgreements(store: StrictLeaderboardAgreementStore, query: StrictLeaderboardAgreementQuery): StrictLeaderboardAgreement[] {
  return query.apply(store.list());
}
