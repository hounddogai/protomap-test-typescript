import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

/** Keeps weighted redemption proposals by code. */
export interface WeightedRedemptionProposalStore {
  find(code: string): WeightedRedemptionProposal | undefined;
  save(item: WeightedRedemptionProposal): void;
  remove(code: string): boolean;
  list(): WeightedRedemptionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRedemptionProposalStore implements WeightedRedemptionProposalStore {
  items: Map<string, WeightedRedemptionProposal>;
  order: string[];

  constructor(items: Map<string, WeightedRedemptionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRedemptionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRedemptionProposal): void {
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

  list(): WeightedRedemptionProposal[] {
    const out: WeightedRedemptionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRedemptionProposalStore(): WeightedRedemptionProposalStore {
  return new MemoryWeightedRedemptionProposalStore(new Map<string, WeightedRedemptionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRedemptionProposalStore implements WeightedRedemptionProposalStore {
  inner: WeightedRedemptionProposalStore;
  cache: cache.TtlCache<WeightedRedemptionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRedemptionProposalStore,
    cacheValue: cache.TtlCache<WeightedRedemptionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRedemptionProposal | undefined {
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

  save(item: WeightedRedemptionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRedemptionProposal[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRedemptionProposalStore(inner: WeightedRedemptionProposalStore, ttl: number, clockValue: clock.Clock): WeightedRedemptionProposalStore {
  return new CachedWeightedRedemptionProposalStore(
    inner,
    cache.newTtlCache<WeightedRedemptionProposal>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted redemption proposals. Empty fields match all. */
export class WeightedRedemptionProposalQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRedemptionProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRedemptionProposal[]): WeightedRedemptionProposal[] {
    const matched = collections.filter(items, (candidate: WeightedRedemptionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRedemptionProposals(store: WeightedRedemptionProposalStore, query: WeightedRedemptionProposalQuery): WeightedRedemptionProposal[] {
  return query.apply(store.list());
}
