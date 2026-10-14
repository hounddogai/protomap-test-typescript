import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalLevelProposal } from "./seasonal-level-proposal.js";

/** Keeps seasonal level proposals by code. */
export interface SeasonalLevelProposalStore {
  find(code: string): SeasonalLevelProposal | undefined;
  save(item: SeasonalLevelProposal): void;
  remove(code: string): boolean;
  list(): SeasonalLevelProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalLevelProposalStore implements SeasonalLevelProposalStore {
  items: Map<string, SeasonalLevelProposal>;
  order: string[];

  constructor(items: Map<string, SeasonalLevelProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalLevelProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalLevelProposal): void {
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

  list(): SeasonalLevelProposal[] {
    const out: SeasonalLevelProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalLevelProposalStore(): SeasonalLevelProposalStore {
  return new MemorySeasonalLevelProposalStore(new Map<string, SeasonalLevelProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalLevelProposalStore implements SeasonalLevelProposalStore {
  inner: SeasonalLevelProposalStore;
  cache: cache.TtlCache<SeasonalLevelProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalLevelProposalStore,
    cacheValue: cache.TtlCache<SeasonalLevelProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalLevelProposal | undefined {
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

  save(item: SeasonalLevelProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalLevelProposal[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalLevelProposalStore(inner: SeasonalLevelProposalStore, ttl: number, clockValue: clock.Clock): SeasonalLevelProposalStore {
  return new CachedSeasonalLevelProposalStore(
    inner,
    cache.newTtlCache<SeasonalLevelProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal level proposals. Empty fields match all. */
export class SeasonalLevelProposalQuery {
  title: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minBudget: number, statuses: string[], limit: number) {
    this.title = title;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalLevelProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalLevelProposal[]): SeasonalLevelProposal[] {
    const matched = collections.filter(items, (candidate: SeasonalLevelProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalLevelProposals(store: SeasonalLevelProposalStore, query: SeasonalLevelProposalQuery): SeasonalLevelProposal[] {
  return query.apply(store.list());
}
