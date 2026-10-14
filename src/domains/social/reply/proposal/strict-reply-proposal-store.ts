import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictReplyProposal } from "./strict-reply-proposal.js";

/** Keeps strict reply proposals by code. */
export interface StrictReplyProposalStore {
  find(code: string): StrictReplyProposal | undefined;
  save(item: StrictReplyProposal): void;
  remove(code: string): boolean;
  list(): StrictReplyProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictReplyProposalStore implements StrictReplyProposalStore {
  items: Map<string, StrictReplyProposal>;
  order: string[];

  constructor(items: Map<string, StrictReplyProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictReplyProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictReplyProposal): void {
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

  list(): StrictReplyProposal[] {
    const out: StrictReplyProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictReplyProposalStore(): StrictReplyProposalStore {
  return new MemoryStrictReplyProposalStore(new Map<string, StrictReplyProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictReplyProposalStore implements StrictReplyProposalStore {
  inner: StrictReplyProposalStore;
  cache: cache.TtlCache<StrictReplyProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictReplyProposalStore,
    cacheValue: cache.TtlCache<StrictReplyProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictReplyProposal | undefined {
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

  save(item: StrictReplyProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictReplyProposal[] {
    return this.inner.list();
  }
}

export function newCachedStrictReplyProposalStore(inner: StrictReplyProposalStore, ttl: number, clockValue: clock.Clock): StrictReplyProposalStore {
  return new CachedStrictReplyProposalStore(inner, cache.newTtlCache<StrictReplyProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects strict reply proposals. Empty fields match all. */
export class StrictReplyProposalQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictReplyProposal): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictReplyProposal[]): StrictReplyProposal[] {
    const matched = collections.filter(items, (candidate: StrictReplyProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictReplyProposals(store: StrictReplyProposalStore, query: StrictReplyProposalQuery): StrictReplyProposal[] {
  return query.apply(store.list());
}
