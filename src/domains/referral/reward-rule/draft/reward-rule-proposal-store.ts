import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleProposal } from "./reward-rule-proposal.js";

/** Keeps reward rule proposals by code. */
export interface RewardRuleProposalStore {
  find(code: string): RewardRuleProposal | undefined;
  save(item: RewardRuleProposal): void;
  remove(code: string): boolean;
  list(): RewardRuleProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleProposalStore implements RewardRuleProposalStore {
  items: Map<string, RewardRuleProposal>;
  order: string[];

  constructor(items: Map<string, RewardRuleProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleProposal): void {
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

  list(): RewardRuleProposal[] {
    const out: RewardRuleProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleProposalStore(): RewardRuleProposalStore {
  return new MemoryRewardRuleProposalStore(new Map<string, RewardRuleProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleProposalStore implements RewardRuleProposalStore {
  inner: RewardRuleProposalStore;
  cache: cache.TtlCache<RewardRuleProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleProposalStore,
    cacheValue: cache.TtlCache<RewardRuleProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleProposal | undefined {
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

  save(item: RewardRuleProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleProposal[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleProposalStore(inner: RewardRuleProposalStore, ttl: number, clockValue: clock.Clock): RewardRuleProposalStore {
  return new CachedRewardRuleProposalStore(inner, cache.newTtlCache<RewardRuleProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects reward rule proposals. Empty fields match all. */
export class RewardRuleProposalQuery {
  country: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMaximum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleProposal): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleProposal[]): RewardRuleProposal[] {
    const matched = collections.filter(items, (candidate: RewardRuleProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleProposals(store: RewardRuleProposalStore, query: RewardRuleProposalQuery): RewardRuleProposal[] {
  return query.apply(store.list());
}
