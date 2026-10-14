import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

/** Keeps legacy exit rule proposals by code. */
export interface LegacyExitRuleProposalStore {
  find(code: string): LegacyExitRuleProposal | undefined;
  save(item: LegacyExitRuleProposal): void;
  remove(code: string): boolean;
  list(): LegacyExitRuleProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyExitRuleProposalStore implements LegacyExitRuleProposalStore {
  items: Map<string, LegacyExitRuleProposal>;
  order: string[];

  constructor(items: Map<string, LegacyExitRuleProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyExitRuleProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyExitRuleProposal): void {
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

  list(): LegacyExitRuleProposal[] {
    const out: LegacyExitRuleProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyExitRuleProposalStore(): LegacyExitRuleProposalStore {
  return new MemoryLegacyExitRuleProposalStore(new Map<string, LegacyExitRuleProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyExitRuleProposalStore implements LegacyExitRuleProposalStore {
  inner: LegacyExitRuleProposalStore;
  cache: cache.TtlCache<LegacyExitRuleProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyExitRuleProposalStore,
    cacheValue: cache.TtlCache<LegacyExitRuleProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyExitRuleProposal | undefined {
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

  save(item: LegacyExitRuleProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyExitRuleProposal[] {
    return this.inner.list();
  }
}

export function newCachedLegacyExitRuleProposalStore(inner: LegacyExitRuleProposalStore, ttl: number, clockValue: clock.Clock): LegacyExitRuleProposalStore {
  return new CachedLegacyExitRuleProposalStore(
    inner,
    cache.newTtlCache<LegacyExitRuleProposal>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy exit rule proposals. Empty fields match all. */
export class LegacyExitRuleProposalQuery {
  title: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMargin: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyExitRuleProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyExitRuleProposal[]): LegacyExitRuleProposal[] {
    const matched = collections.filter(items, (candidate: LegacyExitRuleProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyExitRuleProposals(store: LegacyExitRuleProposalStore, query: LegacyExitRuleProposalQuery): LegacyExitRuleProposal[] {
  return query.apply(store.list());
}
