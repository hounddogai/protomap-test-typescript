import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveQueueProposal } from "./adaptive-queue-proposal.js";

/** Keeps adaptive queue proposals by code. */
export interface AdaptiveQueueProposalStore {
  find(code: string): AdaptiveQueueProposal | undefined;
  save(item: AdaptiveQueueProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveQueueProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveQueueProposalStore implements AdaptiveQueueProposalStore {
  items: Map<string, AdaptiveQueueProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveQueueProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveQueueProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveQueueProposal): void {
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

  list(): AdaptiveQueueProposal[] {
    const out: AdaptiveQueueProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveQueueProposalStore(): AdaptiveQueueProposalStore {
  return new MemoryAdaptiveQueueProposalStore(new Map<string, AdaptiveQueueProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveQueueProposalStore implements AdaptiveQueueProposalStore {
  inner: AdaptiveQueueProposalStore;
  cache: cache.TtlCache<AdaptiveQueueProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveQueueProposalStore,
    cacheValue: cache.TtlCache<AdaptiveQueueProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveQueueProposal | undefined {
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

  save(item: AdaptiveQueueProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveQueueProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveQueueProposalStore(inner: AdaptiveQueueProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveQueueProposalStore {
  return new CachedAdaptiveQueueProposalStore(
    inner,
    cache.newTtlCache<AdaptiveQueueProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive queue proposals. Empty fields match all. */
export class AdaptiveQueueProposalQuery {
  country: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBudget: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveQueueProposal): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveQueueProposal[]): AdaptiveQueueProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveQueueProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveQueueProposals(store: AdaptiveQueueProposalStore, query: AdaptiveQueueProposalQuery): AdaptiveQueueProposal[] {
  return query.apply(store.list());
}
