import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPreferenceProposal } from "./fallback-preference-proposal.js";

/** Keeps fallback preference proposals by code. */
export interface FallbackPreferenceProposalStore {
  find(code: string): FallbackPreferenceProposal | undefined;
  save(item: FallbackPreferenceProposal): void;
  remove(code: string): boolean;
  list(): FallbackPreferenceProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPreferenceProposalStore implements FallbackPreferenceProposalStore {
  items: Map<string, FallbackPreferenceProposal>;
  order: string[];

  constructor(items: Map<string, FallbackPreferenceProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPreferenceProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPreferenceProposal): void {
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

  list(): FallbackPreferenceProposal[] {
    const out: FallbackPreferenceProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPreferenceProposalStore(): FallbackPreferenceProposalStore {
  return new MemoryFallbackPreferenceProposalStore(new Map<string, FallbackPreferenceProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPreferenceProposalStore implements FallbackPreferenceProposalStore {
  inner: FallbackPreferenceProposalStore;
  cache: cache.TtlCache<FallbackPreferenceProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPreferenceProposalStore,
    cacheValue: cache.TtlCache<FallbackPreferenceProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPreferenceProposal | undefined {
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

  save(item: FallbackPreferenceProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPreferenceProposal[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPreferenceProposalStore(inner: FallbackPreferenceProposalStore, ttl: number, clockValue: clock.Clock): FallbackPreferenceProposalStore {
  return new CachedFallbackPreferenceProposalStore(
    inner,
    cache.newTtlCache<FallbackPreferenceProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback preference proposals. Empty fields match all. */
export class FallbackPreferenceProposalQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPreferenceProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPreferenceProposal[]): FallbackPreferenceProposal[] {
    const matched = collections.filter(items, (candidate: FallbackPreferenceProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPreferenceProposals(store: FallbackPreferenceProposalStore, query: FallbackPreferenceProposalQuery): FallbackPreferenceProposal[] {
  return query.apply(store.list());
}
