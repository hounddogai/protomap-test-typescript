import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInProposal } from "./double-opt-in-proposal.js";

/** Keeps double opt in proposals by code. */
export interface DoubleOptInProposalStore {
  find(code: string): DoubleOptInProposal | undefined;
  save(item: DoubleOptInProposal): void;
  remove(code: string): boolean;
  list(): DoubleOptInProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInProposalStore implements DoubleOptInProposalStore {
  items: Map<string, DoubleOptInProposal>;
  order: string[];

  constructor(items: Map<string, DoubleOptInProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInProposal): void {
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

  list(): DoubleOptInProposal[] {
    const out: DoubleOptInProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInProposalStore(): DoubleOptInProposalStore {
  return new MemoryDoubleOptInProposalStore(new Map<string, DoubleOptInProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInProposalStore implements DoubleOptInProposalStore {
  inner: DoubleOptInProposalStore;
  cache: cache.TtlCache<DoubleOptInProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInProposalStore,
    cacheValue: cache.TtlCache<DoubleOptInProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInProposal | undefined {
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

  save(item: DoubleOptInProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInProposal[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInProposalStore(inner: DoubleOptInProposalStore, ttl: number, clockValue: clock.Clock): DoubleOptInProposalStore {
  return new CachedDoubleOptInProposalStore(inner, cache.newTtlCache<DoubleOptInProposal>(256, ttl, clockValue), 0, 0);
}

/** Selects double opt in proposals. Empty fields match all. */
export class DoubleOptInProposalQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInProposal[]): DoubleOptInProposal[] {
    const matched = collections.filter(items, (candidate: DoubleOptInProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInProposals(store: DoubleOptInProposalStore, query: DoubleOptInProposalQuery): DoubleOptInProposal[] {
  return query.apply(store.list());
}
