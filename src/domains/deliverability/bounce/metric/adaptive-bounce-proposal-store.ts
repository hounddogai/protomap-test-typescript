import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveBounceProposal } from "./adaptive-bounce-proposal.js";

/** Keeps adaptive bounce proposals by code. */
export interface AdaptiveBounceProposalStore {
  find(code: string): AdaptiveBounceProposal | undefined;
  save(item: AdaptiveBounceProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveBounceProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveBounceProposalStore implements AdaptiveBounceProposalStore {
  items: Map<string, AdaptiveBounceProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveBounceProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveBounceProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveBounceProposal): void {
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

  list(): AdaptiveBounceProposal[] {
    const out: AdaptiveBounceProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveBounceProposalStore(): AdaptiveBounceProposalStore {
  return new MemoryAdaptiveBounceProposalStore(new Map<string, AdaptiveBounceProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveBounceProposalStore implements AdaptiveBounceProposalStore {
  inner: AdaptiveBounceProposalStore;
  cache: cache.TtlCache<AdaptiveBounceProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveBounceProposalStore,
    cacheValue: cache.TtlCache<AdaptiveBounceProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveBounceProposal | undefined {
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

  save(item: AdaptiveBounceProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveBounceProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveBounceProposalStore(inner: AdaptiveBounceProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveBounceProposalStore {
  return new CachedAdaptiveBounceProposalStore(
    inner,
    cache.newTtlCache<AdaptiveBounceProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive bounce proposals. Empty fields match all. */
export class AdaptiveBounceProposalQuery {
  utmSource: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBudget: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveBounceProposal): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveBounceProposal[]): AdaptiveBounceProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveBounceProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveBounceProposals(store: AdaptiveBounceProposalStore, query: AdaptiveBounceProposalQuery): AdaptiveBounceProposal[] {
  return query.apply(store.list());
}
