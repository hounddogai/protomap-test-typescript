import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

/** Keeps batched leaderboard proposals by code. */
export interface BatchedLeaderboardProposalStore {
  find(code: string): BatchedLeaderboardProposal | undefined;
  save(item: BatchedLeaderboardProposal): void;
  remove(code: string): boolean;
  list(): BatchedLeaderboardProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedLeaderboardProposalStore implements BatchedLeaderboardProposalStore {
  items: Map<string, BatchedLeaderboardProposal>;
  order: string[];

  constructor(items: Map<string, BatchedLeaderboardProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedLeaderboardProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedLeaderboardProposal): void {
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

  list(): BatchedLeaderboardProposal[] {
    const out: BatchedLeaderboardProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedLeaderboardProposalStore(): BatchedLeaderboardProposalStore {
  return new MemoryBatchedLeaderboardProposalStore(new Map<string, BatchedLeaderboardProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedLeaderboardProposalStore implements BatchedLeaderboardProposalStore {
  inner: BatchedLeaderboardProposalStore;
  cache: cache.TtlCache<BatchedLeaderboardProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedLeaderboardProposalStore,
    cacheValue: cache.TtlCache<BatchedLeaderboardProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedLeaderboardProposal | undefined {
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

  save(item: BatchedLeaderboardProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedLeaderboardProposal[] {
    return this.inner.list();
  }
}

export function newCachedBatchedLeaderboardProposalStore(inner: BatchedLeaderboardProposalStore, ttl: number, clockValue: clock.Clock): BatchedLeaderboardProposalStore {
  return new CachedBatchedLeaderboardProposalStore(
    inner,
    cache.newTtlCache<BatchedLeaderboardProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched leaderboard proposals. Empty fields match all. */
export class BatchedLeaderboardProposalQuery {
  label: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minVersion: number, statuses: string[], limit: number) {
    this.label = label;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedLeaderboardProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedLeaderboardProposal[]): BatchedLeaderboardProposal[] {
    const matched = collections.filter(items, (candidate: BatchedLeaderboardProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedLeaderboardProposals(store: BatchedLeaderboardProposalStore, query: BatchedLeaderboardProposalQuery): BatchedLeaderboardProposal[] {
  return query.apply(store.list());
}
