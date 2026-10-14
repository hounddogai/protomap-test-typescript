import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainProposal } from "./domain-proposal.js";

/** Keeps domain proposals by code. */
export interface DomainProposalStore {
  find(code: string): DomainProposal | undefined;
  save(item: DomainProposal): void;
  remove(code: string): boolean;
  list(): DomainProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainProposalStore implements DomainProposalStore {
  items: Map<string, DomainProposal>;
  order: string[];

  constructor(items: Map<string, DomainProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainProposal): void {
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

  list(): DomainProposal[] {
    const out: DomainProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainProposalStore(): DomainProposalStore {
  return new MemoryDomainProposalStore(new Map<string, DomainProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainProposalStore implements DomainProposalStore {
  inner: DomainProposalStore;
  cache: cache.TtlCache<DomainProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: DomainProposalStore,
    cacheValue: cache.TtlCache<DomainProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainProposal | undefined {
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

  save(item: DomainProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainProposal[] {
    return this.inner.list();
  }
}

export function newCachedDomainProposalStore(inner: DomainProposalStore, ttl: number, clockValue: clock.Clock): DomainProposalStore {
  return new CachedDomainProposalStore(inner, cache.newTtlCache<DomainProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects domain proposals. Empty fields match all. */
export class DomainProposalQuery {
  source: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minWindowDays: number, statuses: string[], limit: number) {
    this.source = source;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainProposal): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainProposal[]): DomainProposal[] {
    const matched = collections.filter(items, (candidate: DomainProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainProposals(store: DomainProposalStore, query: DomainProposalQuery): DomainProposal[] {
  return query.apply(store.list());
}
