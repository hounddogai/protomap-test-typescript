import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFrequencyProposal } from "./pending-frequency-proposal.js";

/** Keeps pending frequency proposals by code. */
export interface PendingFrequencyProposalStore {
  find(code: string): PendingFrequencyProposal | undefined;
  save(item: PendingFrequencyProposal): void;
  remove(code: string): boolean;
  list(): PendingFrequencyProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFrequencyProposalStore implements PendingFrequencyProposalStore {
  items: Map<string, PendingFrequencyProposal>;
  order: string[];

  constructor(items: Map<string, PendingFrequencyProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFrequencyProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFrequencyProposal): void {
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

  list(): PendingFrequencyProposal[] {
    const out: PendingFrequencyProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFrequencyProposalStore(): PendingFrequencyProposalStore {
  return new MemoryPendingFrequencyProposalStore(new Map<string, PendingFrequencyProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFrequencyProposalStore implements PendingFrequencyProposalStore {
  inner: PendingFrequencyProposalStore;
  cache: cache.TtlCache<PendingFrequencyProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFrequencyProposalStore,
    cacheValue: cache.TtlCache<PendingFrequencyProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFrequencyProposal | undefined {
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

  save(item: PendingFrequencyProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFrequencyProposal[] {
    return this.inner.list();
  }
}

export function newCachedPendingFrequencyProposalStore(inner: PendingFrequencyProposalStore, ttl: number, clockValue: clock.Clock): PendingFrequencyProposalStore {
  return new CachedPendingFrequencyProposalStore(
    inner,
    cache.newTtlCache<PendingFrequencyProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending frequency proposals. Empty fields match all. */
export class PendingFrequencyProposalQuery {
  channel: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFrequencyProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFrequencyProposal[]): PendingFrequencyProposal[] {
    const matched = collections.filter(items, (candidate: PendingFrequencyProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFrequencyProposals(store: PendingFrequencyProposalStore, query: PendingFrequencyProposalQuery): PendingFrequencyProposal[] {
  return query.apply(store.list());
}
