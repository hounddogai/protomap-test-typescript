import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredReputationProposal } from "./tiered-reputation-proposal.js";

/** Keeps tiered reputation proposals by code. */
export interface TieredReputationProposalStore {
  find(code: string): TieredReputationProposal | undefined;
  save(item: TieredReputationProposal): void;
  remove(code: string): boolean;
  list(): TieredReputationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredReputationProposalStore implements TieredReputationProposalStore {
  items: Map<string, TieredReputationProposal>;
  order: string[];

  constructor(items: Map<string, TieredReputationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredReputationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredReputationProposal): void {
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

  list(): TieredReputationProposal[] {
    const out: TieredReputationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredReputationProposalStore(): TieredReputationProposalStore {
  return new MemoryTieredReputationProposalStore(new Map<string, TieredReputationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredReputationProposalStore implements TieredReputationProposalStore {
  inner: TieredReputationProposalStore;
  cache: cache.TtlCache<TieredReputationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredReputationProposalStore,
    cacheValue: cache.TtlCache<TieredReputationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredReputationProposal | undefined {
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

  save(item: TieredReputationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredReputationProposal[] {
    return this.inner.list();
  }
}

export function newCachedTieredReputationProposalStore(inner: TieredReputationProposalStore, ttl: number, clockValue: clock.Clock): TieredReputationProposalStore {
  return new CachedTieredReputationProposalStore(
    inner,
    cache.newTtlCache<TieredReputationProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered reputation proposals. Empty fields match all. */
export class TieredReputationProposalQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredReputationProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredReputationProposal[]): TieredReputationProposal[] {
    const matched = collections.filter(items, (candidate: TieredReputationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredReputationProposals(store: TieredReputationProposalStore, query: TieredReputationProposalQuery): TieredReputationProposal[] {
  return query.apply(store.list());
}
