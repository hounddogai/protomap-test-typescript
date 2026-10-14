import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ChallengeProposal } from "./challenge-proposal.js";

/** Keeps challenge proposals by code. */
export interface ChallengeProposalStore {
  find(code: string): ChallengeProposal | undefined;
  save(item: ChallengeProposal): void;
  remove(code: string): boolean;
  list(): ChallengeProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryChallengeProposalStore implements ChallengeProposalStore {
  items: Map<string, ChallengeProposal>;
  order: string[];

  constructor(items: Map<string, ChallengeProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ChallengeProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ChallengeProposal): void {
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

  list(): ChallengeProposal[] {
    const out: ChallengeProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryChallengeProposalStore(): ChallengeProposalStore {
  return new MemoryChallengeProposalStore(new Map<string, ChallengeProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedChallengeProposalStore implements ChallengeProposalStore {
  inner: ChallengeProposalStore;
  cache: cache.TtlCache<ChallengeProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ChallengeProposalStore,
    cacheValue: cache.TtlCache<ChallengeProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ChallengeProposal | undefined {
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

  save(item: ChallengeProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ChallengeProposal[] {
    return this.inner.list();
  }
}

export function newCachedChallengeProposalStore(inner: ChallengeProposalStore, ttl: number, clockValue: clock.Clock): ChallengeProposalStore {
  return new CachedChallengeProposalStore(inner, cache.newTtlCache<ChallengeProposal>(256, ttl, clockValue), 0, 0);
}

/** Selects challenge proposals. Empty fields match all. */
export class ChallengeProposalQuery {
  segment: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAttempts: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ChallengeProposal): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ChallengeProposal[]): ChallengeProposal[] {
    const matched = collections.filter(items, (candidate: ChallengeProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findChallengeProposals(store: ChallengeProposalStore, query: ChallengeProposalQuery): ChallengeProposal[] {
  return query.apply(store.list());
}
