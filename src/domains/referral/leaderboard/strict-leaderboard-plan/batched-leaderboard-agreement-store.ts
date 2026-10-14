import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

/** Keeps batched leaderboard agreements by code. */
export interface BatchedLeaderboardAgreementStore {
  find(code: string): BatchedLeaderboardAgreement | undefined;
  save(item: BatchedLeaderboardAgreement): void;
  remove(code: string): boolean;
  list(): BatchedLeaderboardAgreement[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedLeaderboardAgreementStore implements BatchedLeaderboardAgreementStore {
  items: Map<string, BatchedLeaderboardAgreement>;
  order: string[];

  constructor(items: Map<string, BatchedLeaderboardAgreement>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedLeaderboardAgreement | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedLeaderboardAgreement): void {
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

  list(): BatchedLeaderboardAgreement[] {
    const out: BatchedLeaderboardAgreement[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedLeaderboardAgreementStore(): BatchedLeaderboardAgreementStore {
  return new MemoryBatchedLeaderboardAgreementStore(new Map<string, BatchedLeaderboardAgreement>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedLeaderboardAgreementStore implements BatchedLeaderboardAgreementStore {
  inner: BatchedLeaderboardAgreementStore;
  cache: cache.TtlCache<BatchedLeaderboardAgreement>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedLeaderboardAgreementStore,
    cacheValue: cache.TtlCache<BatchedLeaderboardAgreement>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedLeaderboardAgreement | undefined {
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

  save(item: BatchedLeaderboardAgreement): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedLeaderboardAgreement[] {
    return this.inner.list();
  }
}

export function newCachedBatchedLeaderboardAgreementStore(inner: BatchedLeaderboardAgreementStore, ttl: number, clockValue: clock.Clock): BatchedLeaderboardAgreementStore {
  return new CachedBatchedLeaderboardAgreementStore(
    inner,
    cache.newTtlCache<BatchedLeaderboardAgreement>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched leaderboard agreements. Empty fields match all. */
export class BatchedLeaderboardAgreementQuery {
  channel: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minDiscount: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedLeaderboardAgreement): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedLeaderboardAgreement[]): BatchedLeaderboardAgreement[] {
    const matched = collections.filter(items, (candidate: BatchedLeaderboardAgreement): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedLeaderboardAgreements(store: BatchedLeaderboardAgreementStore, query: BatchedLeaderboardAgreementQuery): BatchedLeaderboardAgreement[] {
  return query.apply(store.list());
}
