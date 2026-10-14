import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeProposal } from "./adaptive-challenge-proposal.js";

/** Keeps adaptive challenge proposals by code. */
export interface AdaptiveChallengeProposalStore {
  find(code: string): AdaptiveChallengeProposal | undefined;
  save(item: AdaptiveChallengeProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveChallengeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveChallengeProposalStore implements AdaptiveChallengeProposalStore {
  items: Map<string, AdaptiveChallengeProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveChallengeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveChallengeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveChallengeProposal): void {
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

  list(): AdaptiveChallengeProposal[] {
    const out: AdaptiveChallengeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveChallengeProposalStore(): AdaptiveChallengeProposalStore {
  return new MemoryAdaptiveChallengeProposalStore(new Map<string, AdaptiveChallengeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveChallengeProposalStore implements AdaptiveChallengeProposalStore {
  inner: AdaptiveChallengeProposalStore;
  cache: cache.TtlCache<AdaptiveChallengeProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveChallengeProposalStore,
    cacheValue: cache.TtlCache<AdaptiveChallengeProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveChallengeProposal | undefined {
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

  save(item: AdaptiveChallengeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveChallengeProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveChallengeProposalStore(inner: AdaptiveChallengeProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveChallengeProposalStore {
  return new CachedAdaptiveChallengeProposalStore(
    inner,
    cache.newTtlCache<AdaptiveChallengeProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive challenge proposals. Empty fields match all. */
export class AdaptiveChallengeProposalQuery {
  name: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.name = name;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveChallengeProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveChallengeProposal[]): AdaptiveChallengeProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveChallengeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveChallengeProposals(store: AdaptiveChallengeProposalStore, query: AdaptiveChallengeProposalQuery): AdaptiveChallengeProposal[] {
  return query.apply(store.list());
}
