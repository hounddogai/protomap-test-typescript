import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSenderProposal } from "./adaptive-sender-proposal.js";

/** Keeps adaptive sender proposals by code. */
export interface AdaptiveSenderProposalStore {
  find(code: string): AdaptiveSenderProposal | undefined;
  save(item: AdaptiveSenderProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveSenderProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSenderProposalStore implements AdaptiveSenderProposalStore {
  items: Map<string, AdaptiveSenderProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveSenderProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSenderProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSenderProposal): void {
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

  list(): AdaptiveSenderProposal[] {
    const out: AdaptiveSenderProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSenderProposalStore(): AdaptiveSenderProposalStore {
  return new MemoryAdaptiveSenderProposalStore(new Map<string, AdaptiveSenderProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSenderProposalStore implements AdaptiveSenderProposalStore {
  inner: AdaptiveSenderProposalStore;
  cache: cache.TtlCache<AdaptiveSenderProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSenderProposalStore,
    cacheValue: cache.TtlCache<AdaptiveSenderProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSenderProposal | undefined {
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

  save(item: AdaptiveSenderProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSenderProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSenderProposalStore(inner: AdaptiveSenderProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveSenderProposalStore {
  return new CachedAdaptiveSenderProposalStore(
    inner,
    cache.newTtlCache<AdaptiveSenderProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive sender proposals. Empty fields match all. */
export class AdaptiveSenderProposalQuery {
  category: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minScore: number, statuses: string[], limit: number) {
    this.category = category;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSenderProposal): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSenderProposal[]): AdaptiveSenderProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveSenderProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSenderProposals(store: AdaptiveSenderProposalStore, query: AdaptiveSenderProposalQuery): AdaptiveSenderProposal[] {
  return query.apply(store.list());
}
