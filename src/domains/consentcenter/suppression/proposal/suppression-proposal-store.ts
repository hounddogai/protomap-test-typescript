import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionProposal } from "./suppression-proposal.js";

/** Keeps suppression proposals by code. */
export interface SuppressionProposalStore {
  find(code: string): SuppressionProposal | undefined;
  save(item: SuppressionProposal): void;
  remove(code: string): boolean;
  list(): SuppressionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionProposalStore implements SuppressionProposalStore {
  items: Map<string, SuppressionProposal>;
  order: string[];

  constructor(items: Map<string, SuppressionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionProposal): void {
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

  list(): SuppressionProposal[] {
    const out: SuppressionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionProposalStore(): SuppressionProposalStore {
  return new MemorySuppressionProposalStore(new Map<string, SuppressionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionProposalStore implements SuppressionProposalStore {
  inner: SuppressionProposalStore;
  cache: cache.TtlCache<SuppressionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionProposalStore,
    cacheValue: cache.TtlCache<SuppressionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionProposal | undefined {
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

  save(item: SuppressionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionProposal[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionProposalStore(inner: SuppressionProposalStore, ttl: number, clockValue: clock.Clock): SuppressionProposalStore {
  return new CachedSuppressionProposalStore(inner, cache.newTtlCache<SuppressionProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects suppression proposals. Empty fields match all. */
export class SuppressionProposalQuery {
  channel: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRetries: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionProposal): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionProposal[]): SuppressionProposal[] {
    const matched = collections.filter(items, (candidate: SuppressionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionProposals(store: SuppressionProposalStore, query: SuppressionProposalQuery): SuppressionProposal[] {
  return query.apply(store.list());
}
