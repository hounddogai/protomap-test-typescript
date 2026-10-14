import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientReputationProposal } from "./lenient-reputation-proposal.js";

/** Keeps lenient reputation proposals by code. */
export interface LenientReputationProposalStore {
  find(code: string): LenientReputationProposal | undefined;
  save(item: LenientReputationProposal): void;
  remove(code: string): boolean;
  list(): LenientReputationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientReputationProposalStore implements LenientReputationProposalStore {
  items: Map<string, LenientReputationProposal>;
  order: string[];

  constructor(items: Map<string, LenientReputationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientReputationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientReputationProposal): void {
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

  list(): LenientReputationProposal[] {
    const out: LenientReputationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientReputationProposalStore(): LenientReputationProposalStore {
  return new MemoryLenientReputationProposalStore(new Map<string, LenientReputationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientReputationProposalStore implements LenientReputationProposalStore {
  inner: LenientReputationProposalStore;
  cache: cache.TtlCache<LenientReputationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientReputationProposalStore,
    cacheValue: cache.TtlCache<LenientReputationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientReputationProposal | undefined {
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

  save(item: LenientReputationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientReputationProposal[] {
    return this.inner.list();
  }
}

export function newCachedLenientReputationProposalStore(inner: LenientReputationProposalStore, ttl: number, clockValue: clock.Clock): LenientReputationProposalStore {
  return new CachedLenientReputationProposalStore(
    inner,
    cache.newTtlCache<LenientReputationProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient reputation proposals. Empty fields match all. */
export class LenientReputationProposalQuery {
  label: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBid: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientReputationProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientReputationProposal[]): LenientReputationProposal[] {
    const matched = collections.filter(items, (candidate: LenientReputationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientReputationProposals(store: LenientReputationProposalStore, query: LenientReputationProposalQuery): LenientReputationProposal[] {
  return query.apply(store.list());
}
