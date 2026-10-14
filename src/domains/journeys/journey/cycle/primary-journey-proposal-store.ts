import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryJourneyProposal } from "./primary-journey-proposal.js";

/** Keeps primary journey proposals by code. */
export interface PrimaryJourneyProposalStore {
  find(code: string): PrimaryJourneyProposal | undefined;
  save(item: PrimaryJourneyProposal): void;
  remove(code: string): boolean;
  list(): PrimaryJourneyProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryJourneyProposalStore implements PrimaryJourneyProposalStore {
  items: Map<string, PrimaryJourneyProposal>;
  order: string[];

  constructor(items: Map<string, PrimaryJourneyProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryJourneyProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryJourneyProposal): void {
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

  list(): PrimaryJourneyProposal[] {
    const out: PrimaryJourneyProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryJourneyProposalStore(): PrimaryJourneyProposalStore {
  return new MemoryPrimaryJourneyProposalStore(new Map<string, PrimaryJourneyProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryJourneyProposalStore implements PrimaryJourneyProposalStore {
  inner: PrimaryJourneyProposalStore;
  cache: cache.TtlCache<PrimaryJourneyProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryJourneyProposalStore,
    cacheValue: cache.TtlCache<PrimaryJourneyProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryJourneyProposal | undefined {
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

  save(item: PrimaryJourneyProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryJourneyProposal[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryJourneyProposalStore(inner: PrimaryJourneyProposalStore, ttl: number, clockValue: clock.Clock): PrimaryJourneyProposalStore {
  return new CachedPrimaryJourneyProposalStore(
    inner,
    cache.newTtlCache<PrimaryJourneyProposal>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary journey proposals. Empty fields match all. */
export class PrimaryJourneyProposalQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryJourneyProposal): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryJourneyProposal[]): PrimaryJourneyProposal[] {
    const matched = collections.filter(items, (candidate: PrimaryJourneyProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryJourneyProposals(store: PrimaryJourneyProposalStore, query: PrimaryJourneyProposalQuery): PrimaryJourneyProposal[] {
  return query.apply(store.list());
}
