import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRetentionProposal } from "./weighted-retention-proposal.js";

/** Keeps weighted retention proposals by code. */
export interface WeightedRetentionProposalStore {
  find(code: string): WeightedRetentionProposal | undefined;
  save(item: WeightedRetentionProposal): void;
  remove(code: string): boolean;
  list(): WeightedRetentionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRetentionProposalStore implements WeightedRetentionProposalStore {
  items: Map<string, WeightedRetentionProposal>;
  order: string[];

  constructor(items: Map<string, WeightedRetentionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRetentionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRetentionProposal): void {
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

  list(): WeightedRetentionProposal[] {
    const out: WeightedRetentionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRetentionProposalStore(): WeightedRetentionProposalStore {
  return new MemoryWeightedRetentionProposalStore(new Map<string, WeightedRetentionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRetentionProposalStore implements WeightedRetentionProposalStore {
  inner: WeightedRetentionProposalStore;
  cache: cache.TtlCache<WeightedRetentionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRetentionProposalStore,
    cacheValue: cache.TtlCache<WeightedRetentionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRetentionProposal | undefined {
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

  save(item: WeightedRetentionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRetentionProposal[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRetentionProposalStore(inner: WeightedRetentionProposalStore, ttl: number, clockValue: clock.Clock): WeightedRetentionProposalStore {
  return new CachedWeightedRetentionProposalStore(
    inner,
    cache.newTtlCache<WeightedRetentionProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted retention proposals. Empty fields match all. */
export class WeightedRetentionProposalQuery {
  label: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCeiling: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRetentionProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRetentionProposal[]): WeightedRetentionProposal[] {
    const matched = collections.filter(items, (candidate: WeightedRetentionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRetentionProposals(store: WeightedRetentionProposalStore, query: WeightedRetentionProposalQuery): WeightedRetentionProposal[] {
  return query.apply(store.list());
}
