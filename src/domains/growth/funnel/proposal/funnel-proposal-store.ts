import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FunnelProposal } from "./funnel-proposal.js";

/** Keeps funnel proposals by code. */
export interface FunnelProposalStore {
  find(code: string): FunnelProposal | undefined;
  save(item: FunnelProposal): void;
  remove(code: string): boolean;
  list(): FunnelProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFunnelProposalStore implements FunnelProposalStore {
  items: Map<string, FunnelProposal>;
  order: string[];

  constructor(items: Map<string, FunnelProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FunnelProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FunnelProposal): void {
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

  list(): FunnelProposal[] {
    const out: FunnelProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFunnelProposalStore(): FunnelProposalStore {
  return new MemoryFunnelProposalStore(new Map<string, FunnelProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFunnelProposalStore implements FunnelProposalStore {
  inner: FunnelProposalStore;
  cache: cache.TtlCache<FunnelProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: FunnelProposalStore,
    cacheValue: cache.TtlCache<FunnelProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FunnelProposal | undefined {
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

  save(item: FunnelProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FunnelProposal[] {
    return this.inner.list();
  }
}

export function newCachedFunnelProposalStore(inner: FunnelProposalStore, ttl: number, clockValue: clock.Clock): FunnelProposalStore {
  return new CachedFunnelProposalStore(inner, cache.newTtlCache<FunnelProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects funnel proposals. Empty fields match all. */
export class FunnelProposalQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FunnelProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FunnelProposal[]): FunnelProposal[] {
    const matched = collections.filter(items, (candidate: FunnelProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFunnelProposals(store: FunnelProposalStore, query: FunnelProposalQuery): FunnelProposal[] {
  return query.apply(store.list());
}
