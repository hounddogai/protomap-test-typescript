import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWindowProposal } from "./weighted-window-proposal.js";

/** Keeps weighted window proposals by code. */
export interface WeightedWindowProposalStore {
  find(code: string): WeightedWindowProposal | undefined;
  save(item: WeightedWindowProposal): void;
  remove(code: string): boolean;
  list(): WeightedWindowProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWindowProposalStore implements WeightedWindowProposalStore {
  items: Map<string, WeightedWindowProposal>;
  order: string[];

  constructor(items: Map<string, WeightedWindowProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWindowProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWindowProposal): void {
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

  list(): WeightedWindowProposal[] {
    const out: WeightedWindowProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWindowProposalStore(): WeightedWindowProposalStore {
  return new MemoryWeightedWindowProposalStore(new Map<string, WeightedWindowProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWindowProposalStore implements WeightedWindowProposalStore {
  inner: WeightedWindowProposalStore;
  cache: cache.TtlCache<WeightedWindowProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWindowProposalStore,
    cacheValue: cache.TtlCache<WeightedWindowProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWindowProposal | undefined {
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

  save(item: WeightedWindowProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWindowProposal[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWindowProposalStore(inner: WeightedWindowProposalStore, ttl: number, clockValue: clock.Clock): WeightedWindowProposalStore {
  return new CachedWeightedWindowProposalStore(
    inner,
    cache.newTtlCache<WeightedWindowProposal>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted window proposals. Empty fields match all. */
export class WeightedWindowProposalQuery {
  title: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAttempts: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWindowProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWindowProposal[]): WeightedWindowProposal[] {
    const matched = collections.filter(items, (candidate: WeightedWindowProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWindowProposals(store: WeightedWindowProposalStore, query: WeightedWindowProposalQuery): WeightedWindowProposal[] {
  return query.apply(store.list());
}
