import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWarmupProposal } from "./lenient-warmup-proposal.js";

/** Keeps lenient warmup proposals by code. */
export interface LenientWarmupProposalStore {
  find(code: string): LenientWarmupProposal | undefined;
  save(item: LenientWarmupProposal): void;
  remove(code: string): boolean;
  list(): LenientWarmupProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWarmupProposalStore implements LenientWarmupProposalStore {
  items: Map<string, LenientWarmupProposal>;
  order: string[];

  constructor(items: Map<string, LenientWarmupProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWarmupProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWarmupProposal): void {
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

  list(): LenientWarmupProposal[] {
    const out: LenientWarmupProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWarmupProposalStore(): LenientWarmupProposalStore {
  return new MemoryLenientWarmupProposalStore(new Map<string, LenientWarmupProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWarmupProposalStore implements LenientWarmupProposalStore {
  inner: LenientWarmupProposalStore;
  cache: cache.TtlCache<LenientWarmupProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWarmupProposalStore,
    cacheValue: cache.TtlCache<LenientWarmupProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWarmupProposal | undefined {
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

  save(item: LenientWarmupProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWarmupProposal[] {
    return this.inner.list();
  }
}

export function newCachedLenientWarmupProposalStore(inner: LenientWarmupProposalStore, ttl: number, clockValue: clock.Clock): LenientWarmupProposalStore {
  return new CachedLenientWarmupProposalStore(
    inner,
    cache.newTtlCache<LenientWarmupProposal>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient warmup proposals. Empty fields match all. */
export class LenientWarmupProposalQuery {
  name: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minLimit: number, statuses: string[], limit: number) {
    this.name = name;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWarmupProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWarmupProposal[]): LenientWarmupProposal[] {
    const matched = collections.filter(items, (candidate: LenientWarmupProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWarmupProposals(store: LenientWarmupProposalStore, query: LenientWarmupProposalQuery): LenientWarmupProposal[] {
  return query.apply(store.list());
}
