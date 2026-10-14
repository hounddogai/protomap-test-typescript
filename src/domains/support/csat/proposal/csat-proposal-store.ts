import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatProposal } from "./csat-proposal.js";

/** Keeps csat proposals by code. */
export interface CsatProposalStore {
  find(code: string): CsatProposal | undefined;
  save(item: CsatProposal): void;
  remove(code: string): boolean;
  list(): CsatProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatProposalStore implements CsatProposalStore {
  items: Map<string, CsatProposal>;
  order: string[];

  constructor(items: Map<string, CsatProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatProposal): void {
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

  list(): CsatProposal[] {
    const out: CsatProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatProposalStore(): CsatProposalStore {
  return new MemoryCsatProposalStore(new Map<string, CsatProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatProposalStore implements CsatProposalStore {
  inner: CsatProposalStore;
  cache: cache.TtlCache<CsatProposal>;
  hits: number;
  misses: number;

  constructor(inner: CsatProposalStore, cacheValue: cache.TtlCache<CsatProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatProposal | undefined {
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

  save(item: CsatProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatProposal[] {
    return this.inner.list();
  }
}

export function newCachedCsatProposalStore(inner: CsatProposalStore, ttl: number, clockValue: clock.Clock): CsatProposalStore {
  return new CachedCsatProposalStore(inner, cache.newTtlCache<CsatProposal>(1024, ttl, clockValue), 0, 0);
}

/** Selects csat proposals. Empty fields match all. */
export class CsatProposalQuery {
  category: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minScore: number, statuses: string[], limit: number) {
    this.category = category;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatProposal): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatProposal[]): CsatProposal[] {
    const matched = collections.filter(items, (candidate: CsatProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatProposals(store: CsatProposalStore, query: CsatProposalQuery): CsatProposal[] {
  return query.apply(store.list());
}
