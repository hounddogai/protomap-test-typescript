import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortProposal } from "./cohort-proposal.js";

/** Keeps cohort proposals by code. */
export interface CohortProposalStore {
  find(code: string): CohortProposal | undefined;
  save(item: CohortProposal): void;
  remove(code: string): boolean;
  list(): CohortProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortProposalStore implements CohortProposalStore {
  items: Map<string, CohortProposal>;
  order: string[];

  constructor(items: Map<string, CohortProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortProposal): void {
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

  list(): CohortProposal[] {
    const out: CohortProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortProposalStore(): CohortProposalStore {
  return new MemoryCohortProposalStore(new Map<string, CohortProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortProposalStore implements CohortProposalStore {
  inner: CohortProposalStore;
  cache: cache.TtlCache<CohortProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: CohortProposalStore,
    cacheValue: cache.TtlCache<CohortProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortProposal | undefined {
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

  save(item: CohortProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortProposal[] {
    return this.inner.list();
  }
}

export function newCachedCohortProposalStore(inner: CohortProposalStore, ttl: number, clockValue: clock.Clock): CohortProposalStore {
  return new CachedCohortProposalStore(inner, cache.newTtlCache<CohortProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects cohort proposals. Empty fields match all. */
export class CohortProposalQuery {
  country: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minBatchSize: number, statuses: string[], limit: number) {
    this.country = country;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortProposal): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortProposal[]): CohortProposal[] {
    const matched = collections.filter(items, (candidate: CohortProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortProposals(store: CohortProposalStore, query: CohortProposalQuery): CohortProposal[] {
  return query.apply(store.list());
}
