import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleProposal } from "./exit-rule-proposal.js";

/** Keeps exit rule proposals by code. */
export interface ExitRuleProposalStore {
  find(code: string): ExitRuleProposal | undefined;
  save(item: ExitRuleProposal): void;
  remove(code: string): boolean;
  list(): ExitRuleProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleProposalStore implements ExitRuleProposalStore {
  items: Map<string, ExitRuleProposal>;
  order: string[];

  constructor(items: Map<string, ExitRuleProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleProposal): void {
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

  list(): ExitRuleProposal[] {
    const out: ExitRuleProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleProposalStore(): ExitRuleProposalStore {
  return new MemoryExitRuleProposalStore(new Map<string, ExitRuleProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleProposalStore implements ExitRuleProposalStore {
  inner: ExitRuleProposalStore;
  cache: cache.TtlCache<ExitRuleProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleProposalStore,
    cacheValue: cache.TtlCache<ExitRuleProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleProposal | undefined {
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

  save(item: ExitRuleProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleProposal[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleProposalStore(inner: ExitRuleProposalStore, ttl: number, clockValue: clock.Clock): ExitRuleProposalStore {
  return new CachedExitRuleProposalStore(inner, cache.newTtlCache<ExitRuleProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects exit rule proposals. Empty fields match all. */
export class ExitRuleProposalQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleProposal[]): ExitRuleProposal[] {
    const matched = collections.filter(items, (candidate: ExitRuleProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleProposals(store: ExitRuleProposalStore, query: ExitRuleProposalQuery): ExitRuleProposal[] {
  return query.apply(store.list());
}
