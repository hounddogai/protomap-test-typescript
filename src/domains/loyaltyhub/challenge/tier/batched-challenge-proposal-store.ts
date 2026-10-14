import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedChallengeProposal } from "./batched-challenge-proposal.js";

/** Keeps batched challenge proposals by code. */
export interface BatchedChallengeProposalStore {
  find(code: string): BatchedChallengeProposal | undefined;
  save(item: BatchedChallengeProposal): void;
  remove(code: string): boolean;
  list(): BatchedChallengeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedChallengeProposalStore implements BatchedChallengeProposalStore {
  items: Map<string, BatchedChallengeProposal>;
  order: string[];

  constructor(items: Map<string, BatchedChallengeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedChallengeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedChallengeProposal): void {
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

  list(): BatchedChallengeProposal[] {
    const out: BatchedChallengeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedChallengeProposalStore(): BatchedChallengeProposalStore {
  return new MemoryBatchedChallengeProposalStore(new Map<string, BatchedChallengeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedChallengeProposalStore implements BatchedChallengeProposalStore {
  inner: BatchedChallengeProposalStore;
  cache: cache.TtlCache<BatchedChallengeProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedChallengeProposalStore,
    cacheValue: cache.TtlCache<BatchedChallengeProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedChallengeProposal | undefined {
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

  save(item: BatchedChallengeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedChallengeProposal[] {
    return this.inner.list();
  }
}

export function newCachedBatchedChallengeProposalStore(inner: BatchedChallengeProposalStore, ttl: number, clockValue: clock.Clock): BatchedChallengeProposalStore {
  return new CachedBatchedChallengeProposalStore(
    inner,
    cache.newTtlCache<BatchedChallengeProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched challenge proposals. Empty fields match all. */
export class BatchedChallengeProposalQuery {
  source: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minOpenRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedChallengeProposal): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedChallengeProposal[]): BatchedChallengeProposal[] {
    const matched = collections.filter(items, (candidate: BatchedChallengeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedChallengeProposals(store: BatchedChallengeProposalStore, query: BatchedChallengeProposalQuery): BatchedChallengeProposal[] {
  return query.apply(store.list());
}
