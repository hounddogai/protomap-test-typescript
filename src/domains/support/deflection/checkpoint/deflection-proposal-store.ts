import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DeflectionProposal } from "./deflection-proposal.js";

/** Keeps deflection proposals by code. */
export interface DeflectionProposalStore {
  find(code: string): DeflectionProposal | undefined;
  save(item: DeflectionProposal): void;
  remove(code: string): boolean;
  list(): DeflectionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDeflectionProposalStore implements DeflectionProposalStore {
  items: Map<string, DeflectionProposal>;
  order: string[];

  constructor(items: Map<string, DeflectionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DeflectionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DeflectionProposal): void {
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

  list(): DeflectionProposal[] {
    const out: DeflectionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDeflectionProposalStore(): DeflectionProposalStore {
  return new MemoryDeflectionProposalStore(new Map<string, DeflectionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDeflectionProposalStore implements DeflectionProposalStore {
  inner: DeflectionProposalStore;
  cache: cache.TtlCache<DeflectionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: DeflectionProposalStore,
    cacheValue: cache.TtlCache<DeflectionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DeflectionProposal | undefined {
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

  save(item: DeflectionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DeflectionProposal[] {
    return this.inner.list();
  }
}

export function newCachedDeflectionProposalStore(inner: DeflectionProposalStore, ttl: number, clockValue: clock.Clock): DeflectionProposalStore {
  return new CachedDeflectionProposalStore(inner, cache.newTtlCache<DeflectionProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects deflection proposals. Empty fields match all. */
export class DeflectionProposalQuery {
  country: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minScore: number, statuses: string[], limit: number) {
    this.country = country;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DeflectionProposal): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DeflectionProposal[]): DeflectionProposal[] {
    const matched = collections.filter(items, (candidate: DeflectionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDeflectionProposals(store: DeflectionProposalStore, query: DeflectionProposalQuery): DeflectionProposal[] {
  return query.apply(store.list());
}
