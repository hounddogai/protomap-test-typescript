import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutProposal } from "./payout-proposal.js";

/** Keeps payout proposals by code. */
export interface PayoutProposalStore {
  find(code: string): PayoutProposal | undefined;
  save(item: PayoutProposal): void;
  remove(code: string): boolean;
  list(): PayoutProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutProposalStore implements PayoutProposalStore {
  items: Map<string, PayoutProposal>;
  order: string[];

  constructor(items: Map<string, PayoutProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutProposal): void {
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

  list(): PayoutProposal[] {
    const out: PayoutProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutProposalStore(): PayoutProposalStore {
  return new MemoryPayoutProposalStore(new Map<string, PayoutProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutProposalStore implements PayoutProposalStore {
  inner: PayoutProposalStore;
  cache: cache.TtlCache<PayoutProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutProposalStore,
    cacheValue: cache.TtlCache<PayoutProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutProposal | undefined {
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

  save(item: PayoutProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutProposal[] {
    return this.inner.list();
  }
}

export function newCachedPayoutProposalStore(inner: PayoutProposalStore, ttl: number, clockValue: clock.Clock): PayoutProposalStore {
  return new CachedPayoutProposalStore(inner, cache.newTtlCache<PayoutProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects payout proposals. Empty fields match all. */
export class PayoutProposalQuery {
  locale: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutProposal[]): PayoutProposal[] {
    const matched = collections.filter(items, (candidate: PayoutProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutProposals(store: PayoutProposalStore, query: PayoutProposalQuery): PayoutProposal[] {
  return query.apply(store.list());
}
