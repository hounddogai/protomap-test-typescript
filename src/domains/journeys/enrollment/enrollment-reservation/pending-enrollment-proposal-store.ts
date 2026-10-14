import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingEnrollmentProposal } from "./pending-enrollment-proposal.js";

/** Keeps pending enrollment proposals by code. */
export interface PendingEnrollmentProposalStore {
  find(code: string): PendingEnrollmentProposal | undefined;
  save(item: PendingEnrollmentProposal): void;
  remove(code: string): boolean;
  list(): PendingEnrollmentProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingEnrollmentProposalStore implements PendingEnrollmentProposalStore {
  items: Map<string, PendingEnrollmentProposal>;
  order: string[];

  constructor(items: Map<string, PendingEnrollmentProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingEnrollmentProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingEnrollmentProposal): void {
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

  list(): PendingEnrollmentProposal[] {
    const out: PendingEnrollmentProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingEnrollmentProposalStore(): PendingEnrollmentProposalStore {
  return new MemoryPendingEnrollmentProposalStore(new Map<string, PendingEnrollmentProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingEnrollmentProposalStore implements PendingEnrollmentProposalStore {
  inner: PendingEnrollmentProposalStore;
  cache: cache.TtlCache<PendingEnrollmentProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingEnrollmentProposalStore,
    cacheValue: cache.TtlCache<PendingEnrollmentProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingEnrollmentProposal | undefined {
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

  save(item: PendingEnrollmentProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingEnrollmentProposal[] {
    return this.inner.list();
  }
}

export function newCachedPendingEnrollmentProposalStore(inner: PendingEnrollmentProposalStore, ttl: number, clockValue: clock.Clock): PendingEnrollmentProposalStore {
  return new CachedPendingEnrollmentProposalStore(
    inner,
    cache.newTtlCache<PendingEnrollmentProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending enrollment proposals. Empty fields match all. */
export class PendingEnrollmentProposalQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingEnrollmentProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingEnrollmentProposal[]): PendingEnrollmentProposal[] {
    const matched = collections.filter(items, (candidate: PendingEnrollmentProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingEnrollmentProposals(store: PendingEnrollmentProposalStore, query: PendingEnrollmentProposalQuery): PendingEnrollmentProposal[] {
  return query.apply(store.list());
}
