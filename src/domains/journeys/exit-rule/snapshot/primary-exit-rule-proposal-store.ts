import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

/** Keeps primary exit rule proposals by code. */
export interface PrimaryExitRuleProposalStore {
  find(code: string): PrimaryExitRuleProposal | undefined;
  save(item: PrimaryExitRuleProposal): void;
  remove(code: string): boolean;
  list(): PrimaryExitRuleProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryExitRuleProposalStore implements PrimaryExitRuleProposalStore {
  items: Map<string, PrimaryExitRuleProposal>;
  order: string[];

  constructor(items: Map<string, PrimaryExitRuleProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryExitRuleProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryExitRuleProposal): void {
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

  list(): PrimaryExitRuleProposal[] {
    const out: PrimaryExitRuleProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryExitRuleProposalStore(): PrimaryExitRuleProposalStore {
  return new MemoryPrimaryExitRuleProposalStore(new Map<string, PrimaryExitRuleProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryExitRuleProposalStore implements PrimaryExitRuleProposalStore {
  inner: PrimaryExitRuleProposalStore;
  cache: cache.TtlCache<PrimaryExitRuleProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryExitRuleProposalStore,
    cacheValue: cache.TtlCache<PrimaryExitRuleProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryExitRuleProposal | undefined {
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

  save(item: PrimaryExitRuleProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryExitRuleProposal[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryExitRuleProposalStore(inner: PrimaryExitRuleProposalStore, ttl: number, clockValue: clock.Clock): PrimaryExitRuleProposalStore {
  return new CachedPrimaryExitRuleProposalStore(
    inner,
    cache.newTtlCache<PrimaryExitRuleProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary exit rule proposals. Empty fields match all. */
export class PrimaryExitRuleProposalQuery {
  name: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAttempts: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryExitRuleProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryExitRuleProposal[]): PrimaryExitRuleProposal[] {
    const matched = collections.filter(items, (candidate: PrimaryExitRuleProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryExitRuleProposals(store: PrimaryExitRuleProposalStore, query: PrimaryExitRuleProposalQuery): PrimaryExitRuleProposal[] {
  return query.apply(store.list());
}
