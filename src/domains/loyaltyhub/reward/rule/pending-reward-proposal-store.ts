import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingRewardProposal } from "./pending-reward-proposal.js";

/** Keeps pending reward proposals by code. */
export interface PendingRewardProposalStore {
  find(code: string): PendingRewardProposal | undefined;
  save(item: PendingRewardProposal): void;
  remove(code: string): boolean;
  list(): PendingRewardProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingRewardProposalStore implements PendingRewardProposalStore {
  items: Map<string, PendingRewardProposal>;
  order: string[];

  constructor(items: Map<string, PendingRewardProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingRewardProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingRewardProposal): void {
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

  list(): PendingRewardProposal[] {
    const out: PendingRewardProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingRewardProposalStore(): PendingRewardProposalStore {
  return new MemoryPendingRewardProposalStore(new Map<string, PendingRewardProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingRewardProposalStore implements PendingRewardProposalStore {
  inner: PendingRewardProposalStore;
  cache: cache.TtlCache<PendingRewardProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingRewardProposalStore,
    cacheValue: cache.TtlCache<PendingRewardProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingRewardProposal | undefined {
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

  save(item: PendingRewardProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingRewardProposal[] {
    return this.inner.list();
  }
}

export function newCachedPendingRewardProposalStore(inner: PendingRewardProposalStore, ttl: number, clockValue: clock.Clock): PendingRewardProposalStore {
  return new CachedPendingRewardProposalStore(
    inner,
    cache.newTtlCache<PendingRewardProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending reward proposals. Empty fields match all. */
export class PendingRewardProposalQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingRewardProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingRewardProposal[]): PendingRewardProposal[] {
    const matched = collections.filter(items, (candidate: PendingRewardProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingRewardProposals(store: PendingRewardProposalStore, query: PendingRewardProposalQuery): PendingRewardProposal[] {
  return query.apply(store.list());
}
