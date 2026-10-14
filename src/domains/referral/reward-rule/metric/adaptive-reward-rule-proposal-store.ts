import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleProposal } from "./adaptive-reward-rule-proposal.js";

/** Keeps adaptive reward rule proposals by code. */
export interface AdaptiveRewardRuleProposalStore {
  find(code: string): AdaptiveRewardRuleProposal | undefined;
  save(item: AdaptiveRewardRuleProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveRewardRuleProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveRewardRuleProposalStore implements AdaptiveRewardRuleProposalStore {
  items: Map<string, AdaptiveRewardRuleProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveRewardRuleProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveRewardRuleProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveRewardRuleProposal): void {
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

  list(): AdaptiveRewardRuleProposal[] {
    const out: AdaptiveRewardRuleProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveRewardRuleProposalStore(): AdaptiveRewardRuleProposalStore {
  return new MemoryAdaptiveRewardRuleProposalStore(new Map<string, AdaptiveRewardRuleProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveRewardRuleProposalStore implements AdaptiveRewardRuleProposalStore {
  inner: AdaptiveRewardRuleProposalStore;
  cache: cache.TtlCache<AdaptiveRewardRuleProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveRewardRuleProposalStore,
    cacheValue: cache.TtlCache<AdaptiveRewardRuleProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveRewardRuleProposal | undefined {
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

  save(item: AdaptiveRewardRuleProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveRewardRuleProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveRewardRuleProposalStore(inner: AdaptiveRewardRuleProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveRewardRuleProposalStore {
  return new CachedAdaptiveRewardRuleProposalStore(
    inner,
    cache.newTtlCache<AdaptiveRewardRuleProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive reward rule proposals. Empty fields match all. */
export class AdaptiveRewardRuleProposalQuery {
  unit: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minClicks: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveRewardRuleProposal): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveRewardRuleProposal[]): AdaptiveRewardRuleProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveRewardRuleProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveRewardRuleProposals(store: AdaptiveRewardRuleProposalStore, query: AdaptiveRewardRuleProposalQuery): AdaptiveRewardRuleProposal[] {
  return query.apply(store.list());
}
