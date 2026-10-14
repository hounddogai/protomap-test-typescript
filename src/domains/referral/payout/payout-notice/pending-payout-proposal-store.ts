import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingPayoutProposal } from "./pending-payout-proposal.js";

/** Keeps pending payout proposals by code. */
export interface PendingPayoutProposalStore {
  find(code: string): PendingPayoutProposal | undefined;
  save(item: PendingPayoutProposal): void;
  remove(code: string): boolean;
  list(): PendingPayoutProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingPayoutProposalStore implements PendingPayoutProposalStore {
  items: Map<string, PendingPayoutProposal>;
  order: string[];

  constructor(items: Map<string, PendingPayoutProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingPayoutProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingPayoutProposal): void {
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

  list(): PendingPayoutProposal[] {
    const out: PendingPayoutProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingPayoutProposalStore(): PendingPayoutProposalStore {
  return new MemoryPendingPayoutProposalStore(new Map<string, PendingPayoutProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingPayoutProposalStore implements PendingPayoutProposalStore {
  inner: PendingPayoutProposalStore;
  cache: cache.TtlCache<PendingPayoutProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingPayoutProposalStore,
    cacheValue: cache.TtlCache<PendingPayoutProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingPayoutProposal | undefined {
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

  save(item: PendingPayoutProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingPayoutProposal[] {
    return this.inner.list();
  }
}

export function newCachedPendingPayoutProposalStore(inner: PendingPayoutProposalStore, ttl: number, clockValue: clock.Clock): PendingPayoutProposalStore {
  return new CachedPendingPayoutProposalStore(
    inner,
    cache.newTtlCache<PendingPayoutProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending payout proposals. Empty fields match all. */
export class PendingPayoutProposalQuery {
  locale: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRevision: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingPayoutProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingPayoutProposal[]): PendingPayoutProposal[] {
    const matched = collections.filter(items, (candidate: PendingPayoutProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingPayoutProposals(store: PendingPayoutProposalStore, query: PendingPayoutProposalQuery): PendingPayoutProposal[] {
  return query.apply(store.list());
}
