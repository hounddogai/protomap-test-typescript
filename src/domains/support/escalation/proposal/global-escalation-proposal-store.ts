import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalEscalationProposal } from "./global-escalation-proposal.js";

/** Keeps global escalation proposals by code. */
export interface GlobalEscalationProposalStore {
  find(code: string): GlobalEscalationProposal | undefined;
  save(item: GlobalEscalationProposal): void;
  remove(code: string): boolean;
  list(): GlobalEscalationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalEscalationProposalStore implements GlobalEscalationProposalStore {
  items: Map<string, GlobalEscalationProposal>;
  order: string[];

  constructor(items: Map<string, GlobalEscalationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalEscalationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalEscalationProposal): void {
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

  list(): GlobalEscalationProposal[] {
    const out: GlobalEscalationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalEscalationProposalStore(): GlobalEscalationProposalStore {
  return new MemoryGlobalEscalationProposalStore(new Map<string, GlobalEscalationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalEscalationProposalStore implements GlobalEscalationProposalStore {
  inner: GlobalEscalationProposalStore;
  cache: cache.TtlCache<GlobalEscalationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalEscalationProposalStore,
    cacheValue: cache.TtlCache<GlobalEscalationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalEscalationProposal | undefined {
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

  save(item: GlobalEscalationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalEscalationProposal[] {
    return this.inner.list();
  }
}

export function newCachedGlobalEscalationProposalStore(inner: GlobalEscalationProposalStore, ttl: number, clockValue: clock.Clock): GlobalEscalationProposalStore {
  return new CachedGlobalEscalationProposalStore(
    inner,
    cache.newTtlCache<GlobalEscalationProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global escalation proposals. Empty fields match all. */
export class GlobalEscalationProposalQuery {
  country: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minGraceDays: number, statuses: string[], limit: number) {
    this.country = country;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalEscalationProposal): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalEscalationProposal[]): GlobalEscalationProposal[] {
    const matched = collections.filter(items, (candidate: GlobalEscalationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalEscalationProposals(store: GlobalEscalationProposalStore, query: GlobalEscalationProposalQuery): GlobalEscalationProposal[] {
  return query.apply(store.list());
}
