import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementProposal } from "./placement-proposal.js";

/** Keeps placement proposals by code. */
export interface PlacementProposalStore {
  find(code: string): PlacementProposal | undefined;
  save(item: PlacementProposal): void;
  remove(code: string): boolean;
  list(): PlacementProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementProposalStore implements PlacementProposalStore {
  items: Map<string, PlacementProposal>;
  order: string[];

  constructor(items: Map<string, PlacementProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementProposal): void {
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

  list(): PlacementProposal[] {
    const out: PlacementProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementProposalStore(): PlacementProposalStore {
  return new MemoryPlacementProposalStore(new Map<string, PlacementProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementProposalStore implements PlacementProposalStore {
  inner: PlacementProposalStore;
  cache: cache.TtlCache<PlacementProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementProposalStore,
    cacheValue: cache.TtlCache<PlacementProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementProposal | undefined {
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

  save(item: PlacementProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementProposal[] {
    return this.inner.list();
  }
}

export function newCachedPlacementProposalStore(inner: PlacementProposalStore, ttl: number, clockValue: clock.Clock): PlacementProposalStore {
  return new CachedPlacementProposalStore(inner, cache.newTtlCache<PlacementProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects placement proposals. Empty fields match all. */
export class PlacementProposalQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementProposal[]): PlacementProposal[] {
    const matched = collections.filter(items, (candidate: PlacementProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementProposals(store: PlacementProposalStore, query: PlacementProposalQuery): PlacementProposal[] {
  return query.apply(store.list());
}
