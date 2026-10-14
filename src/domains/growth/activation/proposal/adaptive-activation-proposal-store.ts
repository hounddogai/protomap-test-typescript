import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

/** Keeps adaptive activation proposals by code. */
export interface AdaptiveActivationProposalStore {
  find(code: string): AdaptiveActivationProposal | undefined;
  save(item: AdaptiveActivationProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveActivationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveActivationProposalStore implements AdaptiveActivationProposalStore {
  items: Map<string, AdaptiveActivationProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveActivationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveActivationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveActivationProposal): void {
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

  list(): AdaptiveActivationProposal[] {
    const out: AdaptiveActivationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveActivationProposalStore(): AdaptiveActivationProposalStore {
  return new MemoryAdaptiveActivationProposalStore(new Map<string, AdaptiveActivationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveActivationProposalStore implements AdaptiveActivationProposalStore {
  inner: AdaptiveActivationProposalStore;
  cache: cache.TtlCache<AdaptiveActivationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveActivationProposalStore,
    cacheValue: cache.TtlCache<AdaptiveActivationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveActivationProposal | undefined {
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

  save(item: AdaptiveActivationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveActivationProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveActivationProposalStore(inner: AdaptiveActivationProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveActivationProposalStore {
  return new CachedAdaptiveActivationProposalStore(
    inner,
    cache.newTtlCache<AdaptiveActivationProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive activation proposals. Empty fields match all. */
export class AdaptiveActivationProposalQuery {
  utmSource: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minBudget: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveActivationProposal): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveActivationProposal[]): AdaptiveActivationProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveActivationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveActivationProposals(store: AdaptiveActivationProposalStore, query: AdaptiveActivationProposalQuery): AdaptiveActivationProposal[] {
  return query.apply(store.list());
}
