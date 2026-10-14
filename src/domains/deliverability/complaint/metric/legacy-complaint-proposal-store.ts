import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyComplaintProposal } from "./legacy-complaint-proposal.js";

/** Keeps legacy complaint proposals by code. */
export interface LegacyComplaintProposalStore {
  find(code: string): LegacyComplaintProposal | undefined;
  save(item: LegacyComplaintProposal): void;
  remove(code: string): boolean;
  list(): LegacyComplaintProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyComplaintProposalStore implements LegacyComplaintProposalStore {
  items: Map<string, LegacyComplaintProposal>;
  order: string[];

  constructor(items: Map<string, LegacyComplaintProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyComplaintProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyComplaintProposal): void {
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

  list(): LegacyComplaintProposal[] {
    const out: LegacyComplaintProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyComplaintProposalStore(): LegacyComplaintProposalStore {
  return new MemoryLegacyComplaintProposalStore(new Map<string, LegacyComplaintProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyComplaintProposalStore implements LegacyComplaintProposalStore {
  inner: LegacyComplaintProposalStore;
  cache: cache.TtlCache<LegacyComplaintProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyComplaintProposalStore,
    cacheValue: cache.TtlCache<LegacyComplaintProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyComplaintProposal | undefined {
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

  save(item: LegacyComplaintProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyComplaintProposal[] {
    return this.inner.list();
  }
}

export function newCachedLegacyComplaintProposalStore(inner: LegacyComplaintProposalStore, ttl: number, clockValue: clock.Clock): LegacyComplaintProposalStore {
  return new CachedLegacyComplaintProposalStore(
    inner,
    cache.newTtlCache<LegacyComplaintProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy complaint proposals. Empty fields match all. */
export class LegacyComplaintProposalQuery {
  label: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minOpenRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyComplaintProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyComplaintProposal[]): LegacyComplaintProposal[] {
    const matched = collections.filter(items, (candidate: LegacyComplaintProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyComplaintProposals(store: LegacyComplaintProposalStore, query: LegacyComplaintProposalQuery): LegacyComplaintProposal[] {
  return query.apply(store.list());
}
