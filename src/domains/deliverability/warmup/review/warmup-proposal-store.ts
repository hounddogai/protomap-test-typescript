import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupProposal } from "./warmup-proposal.js";

/** Keeps warmup proposals by code. */
export interface WarmupProposalStore {
  find(code: string): WarmupProposal | undefined;
  save(item: WarmupProposal): void;
  remove(code: string): boolean;
  list(): WarmupProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupProposalStore implements WarmupProposalStore {
  items: Map<string, WarmupProposal>;
  order: string[];

  constructor(items: Map<string, WarmupProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupProposal): void {
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

  list(): WarmupProposal[] {
    const out: WarmupProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupProposalStore(): WarmupProposalStore {
  return new MemoryWarmupProposalStore(new Map<string, WarmupProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupProposalStore implements WarmupProposalStore {
  inner: WarmupProposalStore;
  cache: cache.TtlCache<WarmupProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupProposalStore,
    cacheValue: cache.TtlCache<WarmupProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupProposal | undefined {
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

  save(item: WarmupProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupProposal[] {
    return this.inner.list();
  }
}

export function newCachedWarmupProposalStore(inner: WarmupProposalStore, ttl: number, clockValue: clock.Clock): WarmupProposalStore {
  return new CachedWarmupProposalStore(inner, cache.newTtlCache<WarmupProposal>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup proposals. Empty fields match all. */
export class WarmupProposalQuery {
  label: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minQuantity: number, statuses: string[], limit: number) {
    this.label = label;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupProposal[]): WarmupProposal[] {
    const matched = collections.filter(items, (candidate: WarmupProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupProposals(store: WarmupProposalStore, query: WarmupProposalQuery): WarmupProposal[] {
  return query.apply(store.list());
}
