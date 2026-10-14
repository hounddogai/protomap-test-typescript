import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalCohortProposal } from "./seasonal-cohort-proposal.js";

/** Keeps seasonal cohort proposals by code. */
export interface SeasonalCohortProposalStore {
  find(code: string): SeasonalCohortProposal | undefined;
  save(item: SeasonalCohortProposal): void;
  remove(code: string): boolean;
  list(): SeasonalCohortProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalCohortProposalStore implements SeasonalCohortProposalStore {
  items: Map<string, SeasonalCohortProposal>;
  order: string[];

  constructor(items: Map<string, SeasonalCohortProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalCohortProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalCohortProposal): void {
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

  list(): SeasonalCohortProposal[] {
    const out: SeasonalCohortProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalCohortProposalStore(): SeasonalCohortProposalStore {
  return new MemorySeasonalCohortProposalStore(new Map<string, SeasonalCohortProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalCohortProposalStore implements SeasonalCohortProposalStore {
  inner: SeasonalCohortProposalStore;
  cache: cache.TtlCache<SeasonalCohortProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalCohortProposalStore,
    cacheValue: cache.TtlCache<SeasonalCohortProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalCohortProposal | undefined {
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

  save(item: SeasonalCohortProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalCohortProposal[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalCohortProposalStore(inner: SeasonalCohortProposalStore, ttl: number, clockValue: clock.Clock): SeasonalCohortProposalStore {
  return new CachedSeasonalCohortProposalStore(
    inner,
    cache.newTtlCache<SeasonalCohortProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal cohort proposals. Empty fields match all. */
export class SeasonalCohortProposalQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalCohortProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalCohortProposal[]): SeasonalCohortProposal[] {
    const matched = collections.filter(items, (candidate: SeasonalCohortProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalCohortProposals(store: SeasonalCohortProposalStore, query: SeasonalCohortProposalQuery): SeasonalCohortProposal[] {
  return query.apply(store.list());
}
