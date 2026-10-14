import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualTierProposal } from "./manual-tier-proposal.js";

/** Keeps manual tier proposals by code. */
export interface ManualTierProposalStore {
  find(code: string): ManualTierProposal | undefined;
  save(item: ManualTierProposal): void;
  remove(code: string): boolean;
  list(): ManualTierProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualTierProposalStore implements ManualTierProposalStore {
  items: Map<string, ManualTierProposal>;
  order: string[];

  constructor(items: Map<string, ManualTierProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualTierProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualTierProposal): void {
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

  list(): ManualTierProposal[] {
    const out: ManualTierProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualTierProposalStore(): ManualTierProposalStore {
  return new MemoryManualTierProposalStore(new Map<string, ManualTierProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualTierProposalStore implements ManualTierProposalStore {
  inner: ManualTierProposalStore;
  cache: cache.TtlCache<ManualTierProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualTierProposalStore,
    cacheValue: cache.TtlCache<ManualTierProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualTierProposal | undefined {
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

  save(item: ManualTierProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualTierProposal[] {
    return this.inner.list();
  }
}

export function newCachedManualTierProposalStore(inner: ManualTierProposalStore, ttl: number, clockValue: clock.Clock): ManualTierProposalStore {
  return new CachedManualTierProposalStore(inner, cache.newTtlCache<ManualTierProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects manual tier proposals. Empty fields match all. */
export class ManualTierProposalQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualTierProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualTierProposal[]): ManualTierProposal[] {
    const matched = collections.filter(items, (candidate: ManualTierProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualTierProposals(store: ManualTierProposalStore, query: ManualTierProposalQuery): ManualTierProposal[] {
  return query.apply(store.list());
}
