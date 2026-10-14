import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPathProposal } from "./strict-path-proposal.js";

/** Keeps strict path proposals by code. */
export interface StrictPathProposalStore {
  find(code: string): StrictPathProposal | undefined;
  save(item: StrictPathProposal): void;
  remove(code: string): boolean;
  list(): StrictPathProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPathProposalStore implements StrictPathProposalStore {
  items: Map<string, StrictPathProposal>;
  order: string[];

  constructor(items: Map<string, StrictPathProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPathProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPathProposal): void {
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

  list(): StrictPathProposal[] {
    const out: StrictPathProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPathProposalStore(): StrictPathProposalStore {
  return new MemoryStrictPathProposalStore(new Map<string, StrictPathProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPathProposalStore implements StrictPathProposalStore {
  inner: StrictPathProposalStore;
  cache: cache.TtlCache<StrictPathProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPathProposalStore,
    cacheValue: cache.TtlCache<StrictPathProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPathProposal | undefined {
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

  save(item: StrictPathProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPathProposal[] {
    return this.inner.list();
  }
}

export function newCachedStrictPathProposalStore(inner: StrictPathProposalStore, ttl: number, clockValue: clock.Clock): StrictPathProposalStore {
  return new CachedStrictPathProposalStore(inner, cache.newTtlCache<StrictPathProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects strict path proposals. Empty fields match all. */
export class StrictPathProposalQuery {
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

  matches(item: StrictPathProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPathProposal[]): StrictPathProposal[] {
    const matched = collections.filter(items, (candidate: StrictPathProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPathProposals(store: StrictPathProposalStore, query: StrictPathProposalQuery): StrictPathProposal[] {
  return query.apply(store.list());
}
