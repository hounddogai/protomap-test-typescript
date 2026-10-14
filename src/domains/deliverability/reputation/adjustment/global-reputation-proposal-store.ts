import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalReputationProposal } from "./global-reputation-proposal.js";

/** Keeps global reputation proposals by code. */
export interface GlobalReputationProposalStore {
  find(code: string): GlobalReputationProposal | undefined;
  save(item: GlobalReputationProposal): void;
  remove(code: string): boolean;
  list(): GlobalReputationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalReputationProposalStore implements GlobalReputationProposalStore {
  items: Map<string, GlobalReputationProposal>;
  order: string[];

  constructor(items: Map<string, GlobalReputationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalReputationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalReputationProposal): void {
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

  list(): GlobalReputationProposal[] {
    const out: GlobalReputationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalReputationProposalStore(): GlobalReputationProposalStore {
  return new MemoryGlobalReputationProposalStore(new Map<string, GlobalReputationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalReputationProposalStore implements GlobalReputationProposalStore {
  inner: GlobalReputationProposalStore;
  cache: cache.TtlCache<GlobalReputationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalReputationProposalStore,
    cacheValue: cache.TtlCache<GlobalReputationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalReputationProposal | undefined {
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

  save(item: GlobalReputationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalReputationProposal[] {
    return this.inner.list();
  }
}

export function newCachedGlobalReputationProposalStore(inner: GlobalReputationProposalStore, ttl: number, clockValue: clock.Clock): GlobalReputationProposalStore {
  return new CachedGlobalReputationProposalStore(
    inner,
    cache.newTtlCache<GlobalReputationProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global reputation proposals. Empty fields match all. */
export class GlobalReputationProposalQuery {
  channel: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minQuantity: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalReputationProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalReputationProposal[]): GlobalReputationProposal[] {
    const matched = collections.filter(items, (candidate: GlobalReputationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalReputationProposals(store: GlobalReputationProposalStore, query: GlobalReputationProposalQuery): GlobalReputationProposal[] {
  return query.apply(store.list());
}
