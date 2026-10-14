import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictSenderProposal } from "./strict-sender-proposal.js";

/** Keeps strict sender proposals by code. */
export interface StrictSenderProposalStore {
  find(code: string): StrictSenderProposal | undefined;
  save(item: StrictSenderProposal): void;
  remove(code: string): boolean;
  list(): StrictSenderProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictSenderProposalStore implements StrictSenderProposalStore {
  items: Map<string, StrictSenderProposal>;
  order: string[];

  constructor(items: Map<string, StrictSenderProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictSenderProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictSenderProposal): void {
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

  list(): StrictSenderProposal[] {
    const out: StrictSenderProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictSenderProposalStore(): StrictSenderProposalStore {
  return new MemoryStrictSenderProposalStore(new Map<string, StrictSenderProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictSenderProposalStore implements StrictSenderProposalStore {
  inner: StrictSenderProposalStore;
  cache: cache.TtlCache<StrictSenderProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictSenderProposalStore,
    cacheValue: cache.TtlCache<StrictSenderProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictSenderProposal | undefined {
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

  save(item: StrictSenderProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictSenderProposal[] {
    return this.inner.list();
  }
}

export function newCachedStrictSenderProposalStore(inner: StrictSenderProposalStore, ttl: number, clockValue: clock.Clock): StrictSenderProposalStore {
  return new CachedStrictSenderProposalStore(
    inner,
    cache.newTtlCache<StrictSenderProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict sender proposals. Empty fields match all. */
export class StrictSenderProposalQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictSenderProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictSenderProposal[]): StrictSenderProposal[] {
    const matched = collections.filter(items, (candidate: StrictSenderProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictSenderProposals(store: StrictSenderProposalStore, query: StrictSenderProposalQuery): StrictSenderProposal[] {
  return query.apply(store.list());
}
