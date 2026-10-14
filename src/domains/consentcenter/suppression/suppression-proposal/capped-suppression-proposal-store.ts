import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedSuppressionProposal } from "./capped-suppression-proposal.js";

/** Keeps capped suppression proposals by code. */
export interface CappedSuppressionProposalStore {
  find(code: string): CappedSuppressionProposal | undefined;
  save(item: CappedSuppressionProposal): void;
  remove(code: string): boolean;
  list(): CappedSuppressionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedSuppressionProposalStore implements CappedSuppressionProposalStore {
  items: Map<string, CappedSuppressionProposal>;
  order: string[];

  constructor(items: Map<string, CappedSuppressionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedSuppressionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedSuppressionProposal): void {
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

  list(): CappedSuppressionProposal[] {
    const out: CappedSuppressionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedSuppressionProposalStore(): CappedSuppressionProposalStore {
  return new MemoryCappedSuppressionProposalStore(new Map<string, CappedSuppressionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedSuppressionProposalStore implements CappedSuppressionProposalStore {
  inner: CappedSuppressionProposalStore;
  cache: cache.TtlCache<CappedSuppressionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedSuppressionProposalStore,
    cacheValue: cache.TtlCache<CappedSuppressionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedSuppressionProposal | undefined {
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

  save(item: CappedSuppressionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedSuppressionProposal[] {
    return this.inner.list();
  }
}

export function newCachedCappedSuppressionProposalStore(inner: CappedSuppressionProposalStore, ttl: number, clockValue: clock.Clock): CappedSuppressionProposalStore {
  return new CachedCappedSuppressionProposalStore(
    inner,
    cache.newTtlCache<CappedSuppressionProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped suppression proposals. Empty fields match all. */
export class CappedSuppressionProposalQuery {
  region: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minQuantity: number, statuses: string[], limit: number) {
    this.region = region;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedSuppressionProposal): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedSuppressionProposal[]): CappedSuppressionProposal[] {
    const matched = collections.filter(items, (candidate: CappedSuppressionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedSuppressionProposals(store: CappedSuppressionProposalStore, query: CappedSuppressionProposalQuery): CappedSuppressionProposal[] {
  return query.apply(store.list());
}
