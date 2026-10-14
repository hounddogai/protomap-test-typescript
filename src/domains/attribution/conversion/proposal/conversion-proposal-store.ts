import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionProposal } from "./conversion-proposal.js";

/** Keeps conversion proposals by code. */
export interface ConversionProposalStore {
  find(code: string): ConversionProposal | undefined;
  save(item: ConversionProposal): void;
  remove(code: string): boolean;
  list(): ConversionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionProposalStore implements ConversionProposalStore {
  items: Map<string, ConversionProposal>;
  order: string[];

  constructor(items: Map<string, ConversionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionProposal): void {
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

  list(): ConversionProposal[] {
    const out: ConversionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionProposalStore(): ConversionProposalStore {
  return new MemoryConversionProposalStore(new Map<string, ConversionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionProposalStore implements ConversionProposalStore {
  inner: ConversionProposalStore;
  cache: cache.TtlCache<ConversionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionProposalStore,
    cacheValue: cache.TtlCache<ConversionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionProposal | undefined {
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

  save(item: ConversionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionProposal[] {
    return this.inner.list();
  }
}

export function newCachedConversionProposalStore(inner: ConversionProposalStore, ttl: number, clockValue: clock.Clock): ConversionProposalStore {
  return new CachedConversionProposalStore(inner, cache.newTtlCache<ConversionProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects conversion proposals. Empty fields match all. */
export class ConversionProposalQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionProposal[]): ConversionProposal[] {
    const matched = collections.filter(items, (candidate: ConversionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionProposals(store: ConversionProposalStore, query: ConversionProposalQuery): ConversionProposal[] {
  return query.apply(store.list());
}
