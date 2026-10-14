import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReputationProposal } from "./reputation-proposal.js";

/** Keeps reputation proposals by code. */
export interface ReputationProposalStore {
  find(code: string): ReputationProposal | undefined;
  save(item: ReputationProposal): void;
  remove(code: string): boolean;
  list(): ReputationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReputationProposalStore implements ReputationProposalStore {
  items: Map<string, ReputationProposal>;
  order: string[];

  constructor(items: Map<string, ReputationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReputationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReputationProposal): void {
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

  list(): ReputationProposal[] {
    const out: ReputationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReputationProposalStore(): ReputationProposalStore {
  return new MemoryReputationProposalStore(new Map<string, ReputationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReputationProposalStore implements ReputationProposalStore {
  inner: ReputationProposalStore;
  cache: cache.TtlCache<ReputationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ReputationProposalStore,
    cacheValue: cache.TtlCache<ReputationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReputationProposal | undefined {
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

  save(item: ReputationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReputationProposal[] {
    return this.inner.list();
  }
}

export function newCachedReputationProposalStore(inner: ReputationProposalStore, ttl: number, clockValue: clock.Clock): ReputationProposalStore {
  return new CachedReputationProposalStore(inner, cache.newTtlCache<ReputationProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects reputation proposals. Empty fields match all. */
export class ReputationProposalQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReputationProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReputationProposal[]): ReputationProposal[] {
    const matched = collections.filter(items, (candidate: ReputationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReputationProposals(store: ReputationProposalStore, query: ReputationProposalQuery): ReputationProposal[] {
  return query.apply(store.list());
}
