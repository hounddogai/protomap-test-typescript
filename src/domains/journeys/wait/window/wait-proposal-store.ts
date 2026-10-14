import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitProposal } from "./wait-proposal.js";

/** Keeps wait proposals by code. */
export interface WaitProposalStore {
  find(code: string): WaitProposal | undefined;
  save(item: WaitProposal): void;
  remove(code: string): boolean;
  list(): WaitProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitProposalStore implements WaitProposalStore {
  items: Map<string, WaitProposal>;
  order: string[];

  constructor(items: Map<string, WaitProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitProposal): void {
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

  list(): WaitProposal[] {
    const out: WaitProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitProposalStore(): WaitProposalStore {
  return new MemoryWaitProposalStore(new Map<string, WaitProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitProposalStore implements WaitProposalStore {
  inner: WaitProposalStore;
  cache: cache.TtlCache<WaitProposal>;
  hits: number;
  misses: number;

  constructor(inner: WaitProposalStore, cacheValue: cache.TtlCache<WaitProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitProposal | undefined {
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

  save(item: WaitProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitProposal[] {
    return this.inner.list();
  }
}

export function newCachedWaitProposalStore(inner: WaitProposalStore, ttl: number, clockValue: clock.Clock): WaitProposalStore {
  return new CachedWaitProposalStore(inner, cache.newTtlCache<WaitProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects wait proposals. Empty fields match all. */
export class WaitProposalQuery {
  name: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMinimum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitProposal[]): WaitProposal[] {
    const matched = collections.filter(items, (candidate: WaitProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitProposals(store: WaitProposalStore, query: WaitProposalQuery): WaitProposal[] {
  return query.apply(store.list());
}
