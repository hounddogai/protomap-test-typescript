import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientTierProposal } from "./lenient-tier-proposal.js";

/** Keeps lenient tier proposals by code. */
export interface LenientTierProposalStore {
  find(code: string): LenientTierProposal | undefined;
  save(item: LenientTierProposal): void;
  remove(code: string): boolean;
  list(): LenientTierProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientTierProposalStore implements LenientTierProposalStore {
  items: Map<string, LenientTierProposal>;
  order: string[];

  constructor(items: Map<string, LenientTierProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientTierProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientTierProposal): void {
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

  list(): LenientTierProposal[] {
    const out: LenientTierProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientTierProposalStore(): LenientTierProposalStore {
  return new MemoryLenientTierProposalStore(new Map<string, LenientTierProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientTierProposalStore implements LenientTierProposalStore {
  inner: LenientTierProposalStore;
  cache: cache.TtlCache<LenientTierProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientTierProposalStore,
    cacheValue: cache.TtlCache<LenientTierProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientTierProposal | undefined {
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

  save(item: LenientTierProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientTierProposal[] {
    return this.inner.list();
  }
}

export function newCachedLenientTierProposalStore(inner: LenientTierProposalStore, ttl: number, clockValue: clock.Clock): LenientTierProposalStore {
  return new CachedLenientTierProposalStore(inner, cache.newTtlCache<LenientTierProposal>(256, ttl, clockValue), 0, 0);
}

/** Selects lenient tier proposals. Empty fields match all. */
export class LenientTierProposalQuery {
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

  matches(item: LenientTierProposal): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientTierProposal[]): LenientTierProposal[] {
    const matched = collections.filter(items, (candidate: LenientTierProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientTierProposals(store: LenientTierProposalStore, query: LenientTierProposalQuery): LenientTierProposal[] {
  return query.apply(store.list());
}
