import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardProposal } from "./reward-proposal.js";

/** Keeps reward proposals by code. */
export interface RewardProposalStore {
  find(code: string): RewardProposal | undefined;
  save(item: RewardProposal): void;
  remove(code: string): boolean;
  list(): RewardProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardProposalStore implements RewardProposalStore {
  items: Map<string, RewardProposal>;
  order: string[];

  constructor(items: Map<string, RewardProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardProposal): void {
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

  list(): RewardProposal[] {
    const out: RewardProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardProposalStore(): RewardProposalStore {
  return new MemoryRewardProposalStore(new Map<string, RewardProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardProposalStore implements RewardProposalStore {
  inner: RewardProposalStore;
  cache: cache.TtlCache<RewardProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardProposalStore,
    cacheValue: cache.TtlCache<RewardProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardProposal | undefined {
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

  save(item: RewardProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardProposal[] {
    return this.inner.list();
  }
}

export function newCachedRewardProposalStore(inner: RewardProposalStore, ttl: number, clockValue: clock.Clock): RewardProposalStore {
  return new CachedRewardProposalStore(inner, cache.newTtlCache<RewardProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects reward proposals. Empty fields match all. */
export class RewardProposalQuery {
  name: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDiscount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardProposal[]): RewardProposal[] {
    const matched = collections.filter(items, (candidate: RewardProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardProposals(store: RewardProposalStore, query: RewardProposalQuery): RewardProposal[] {
  return query.apply(store.list());
}
