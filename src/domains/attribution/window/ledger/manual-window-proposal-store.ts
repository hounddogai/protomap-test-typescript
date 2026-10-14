import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualWindowProposal } from "./manual-window-proposal.js";

/** Keeps manual window proposals by code. */
export interface ManualWindowProposalStore {
  find(code: string): ManualWindowProposal | undefined;
  save(item: ManualWindowProposal): void;
  remove(code: string): boolean;
  list(): ManualWindowProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualWindowProposalStore implements ManualWindowProposalStore {
  items: Map<string, ManualWindowProposal>;
  order: string[];

  constructor(items: Map<string, ManualWindowProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualWindowProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualWindowProposal): void {
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

  list(): ManualWindowProposal[] {
    const out: ManualWindowProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualWindowProposalStore(): ManualWindowProposalStore {
  return new MemoryManualWindowProposalStore(new Map<string, ManualWindowProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualWindowProposalStore implements ManualWindowProposalStore {
  inner: ManualWindowProposalStore;
  cache: cache.TtlCache<ManualWindowProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualWindowProposalStore,
    cacheValue: cache.TtlCache<ManualWindowProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualWindowProposal | undefined {
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

  save(item: ManualWindowProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualWindowProposal[] {
    return this.inner.list();
  }
}

export function newCachedManualWindowProposalStore(inner: ManualWindowProposalStore, ttl: number, clockValue: clock.Clock): ManualWindowProposalStore {
  return new CachedManualWindowProposalStore(
    inner,
    cache.newTtlCache<ManualWindowProposal>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual window proposals. Empty fields match all. */
export class ManualWindowProposalQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualWindowProposal): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualWindowProposal[]): ManualWindowProposal[] {
    const matched = collections.filter(items, (candidate: ManualWindowProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualWindowProposals(store: ManualWindowProposalStore, query: ManualWindowProposalQuery): ManualWindowProposal[] {
  return query.apply(store.list());
}
