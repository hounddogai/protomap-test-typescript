import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCsatProposal } from "./regional-csat-proposal.js";

/** Keeps regional csat proposals by code. */
export interface RegionalCsatProposalStore {
  find(code: string): RegionalCsatProposal | undefined;
  save(item: RegionalCsatProposal): void;
  remove(code: string): boolean;
  list(): RegionalCsatProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCsatProposalStore implements RegionalCsatProposalStore {
  items: Map<string, RegionalCsatProposal>;
  order: string[];

  constructor(items: Map<string, RegionalCsatProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCsatProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCsatProposal): void {
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

  list(): RegionalCsatProposal[] {
    const out: RegionalCsatProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCsatProposalStore(): RegionalCsatProposalStore {
  return new MemoryRegionalCsatProposalStore(new Map<string, RegionalCsatProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCsatProposalStore implements RegionalCsatProposalStore {
  inner: RegionalCsatProposalStore;
  cache: cache.TtlCache<RegionalCsatProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCsatProposalStore,
    cacheValue: cache.TtlCache<RegionalCsatProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCsatProposal | undefined {
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

  save(item: RegionalCsatProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCsatProposal[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCsatProposalStore(inner: RegionalCsatProposalStore, ttl: number, clockValue: clock.Clock): RegionalCsatProposalStore {
  return new CachedRegionalCsatProposalStore(
    inner,
    cache.newTtlCache<RegionalCsatProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional csat proposals. Empty fields match all. */
export class RegionalCsatProposalQuery {
  country: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCeiling: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCsatProposal): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCsatProposal[]): RegionalCsatProposal[] {
    const matched = collections.filter(items, (candidate: RegionalCsatProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCsatProposals(store: RegionalCsatProposalStore, query: RegionalCsatProposalQuery): RegionalCsatProposal[] {
  return query.apply(store.list());
}
