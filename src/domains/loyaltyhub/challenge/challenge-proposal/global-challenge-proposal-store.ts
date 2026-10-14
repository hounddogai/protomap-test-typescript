import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalChallengeProposal } from "./global-challenge-proposal.js";

/** Keeps global challenge proposals by code. */
export interface GlobalChallengeProposalStore {
  find(code: string): GlobalChallengeProposal | undefined;
  save(item: GlobalChallengeProposal): void;
  remove(code: string): boolean;
  list(): GlobalChallengeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalChallengeProposalStore implements GlobalChallengeProposalStore {
  items: Map<string, GlobalChallengeProposal>;
  order: string[];

  constructor(items: Map<string, GlobalChallengeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalChallengeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalChallengeProposal): void {
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

  list(): GlobalChallengeProposal[] {
    const out: GlobalChallengeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalChallengeProposalStore(): GlobalChallengeProposalStore {
  return new MemoryGlobalChallengeProposalStore(new Map<string, GlobalChallengeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalChallengeProposalStore implements GlobalChallengeProposalStore {
  inner: GlobalChallengeProposalStore;
  cache: cache.TtlCache<GlobalChallengeProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalChallengeProposalStore,
    cacheValue: cache.TtlCache<GlobalChallengeProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalChallengeProposal | undefined {
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

  save(item: GlobalChallengeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalChallengeProposal[] {
    return this.inner.list();
  }
}

export function newCachedGlobalChallengeProposalStore(inner: GlobalChallengeProposalStore, ttl: number, clockValue: clock.Clock): GlobalChallengeProposalStore {
  return new CachedGlobalChallengeProposalStore(
    inner,
    cache.newTtlCache<GlobalChallengeProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global challenge proposals. Empty fields match all. */
export class GlobalChallengeProposalQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalChallengeProposal): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalChallengeProposal[]): GlobalChallengeProposal[] {
    const matched = collections.filter(items, (candidate: GlobalChallengeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalChallengeProposals(store: GlobalChallengeProposalStore, query: GlobalChallengeProposalQuery): GlobalChallengeProposal[] {
  return query.apply(store.list());
}
