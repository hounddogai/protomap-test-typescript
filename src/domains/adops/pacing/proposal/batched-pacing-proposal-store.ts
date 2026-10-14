import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPacingProposal } from "./batched-pacing-proposal.js";

/** Keeps batched pacing proposals by code. */
export interface BatchedPacingProposalStore {
  find(code: string): BatchedPacingProposal | undefined;
  save(item: BatchedPacingProposal): void;
  remove(code: string): boolean;
  list(): BatchedPacingProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPacingProposalStore implements BatchedPacingProposalStore {
  items: Map<string, BatchedPacingProposal>;
  order: string[];

  constructor(items: Map<string, BatchedPacingProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPacingProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPacingProposal): void {
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

  list(): BatchedPacingProposal[] {
    const out: BatchedPacingProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPacingProposalStore(): BatchedPacingProposalStore {
  return new MemoryBatchedPacingProposalStore(new Map<string, BatchedPacingProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPacingProposalStore implements BatchedPacingProposalStore {
  inner: BatchedPacingProposalStore;
  cache: cache.TtlCache<BatchedPacingProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPacingProposalStore,
    cacheValue: cache.TtlCache<BatchedPacingProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPacingProposal | undefined {
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

  save(item: BatchedPacingProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPacingProposal[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPacingProposalStore(inner: BatchedPacingProposalStore, ttl: number, clockValue: clock.Clock): BatchedPacingProposalStore {
  return new CachedBatchedPacingProposalStore(
    inner,
    cache.newTtlCache<BatchedPacingProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched pacing proposals. Empty fields match all. */
export class BatchedPacingProposalQuery {
  utmSource: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minWeight: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPacingProposal): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPacingProposal[]): BatchedPacingProposal[] {
    const matched = collections.filter(items, (candidate: BatchedPacingProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPacingProposals(store: BatchedPacingProposalStore, query: BatchedPacingProposalQuery): BatchedPacingProposal[] {
  return query.apply(store.list());
}
