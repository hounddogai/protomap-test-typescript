import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalPlacementProposal } from "./regional-placement-proposal.js";

/** Keeps regional placement proposals by code. */
export interface RegionalPlacementProposalStore {
  find(code: string): RegionalPlacementProposal | undefined;
  save(item: RegionalPlacementProposal): void;
  remove(code: string): boolean;
  list(): RegionalPlacementProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalPlacementProposalStore implements RegionalPlacementProposalStore {
  items: Map<string, RegionalPlacementProposal>;
  order: string[];

  constructor(items: Map<string, RegionalPlacementProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalPlacementProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalPlacementProposal): void {
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

  list(): RegionalPlacementProposal[] {
    const out: RegionalPlacementProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalPlacementProposalStore(): RegionalPlacementProposalStore {
  return new MemoryRegionalPlacementProposalStore(new Map<string, RegionalPlacementProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalPlacementProposalStore implements RegionalPlacementProposalStore {
  inner: RegionalPlacementProposalStore;
  cache: cache.TtlCache<RegionalPlacementProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalPlacementProposalStore,
    cacheValue: cache.TtlCache<RegionalPlacementProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalPlacementProposal | undefined {
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

  save(item: RegionalPlacementProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalPlacementProposal[] {
    return this.inner.list();
  }
}

export function newCachedRegionalPlacementProposalStore(inner: RegionalPlacementProposalStore, ttl: number, clockValue: clock.Clock): RegionalPlacementProposalStore {
  return new CachedRegionalPlacementProposalStore(
    inner,
    cache.newTtlCache<RegionalPlacementProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional placement proposals. Empty fields match all. */
export class RegionalPlacementProposalQuery {
  utmSource: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalPlacementProposal): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalPlacementProposal[]): RegionalPlacementProposal[] {
    const matched = collections.filter(items, (candidate: RegionalPlacementProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalPlacementProposals(store: RegionalPlacementProposalStore, query: RegionalPlacementProposalQuery): RegionalPlacementProposal[] {
  return query.apply(store.list());
}
