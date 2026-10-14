import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultActivationProposal } from "./default-activation-proposal.js";

/** Keeps default activation proposals by code. */
export interface DefaultActivationProposalStore {
  find(code: string): DefaultActivationProposal | undefined;
  save(item: DefaultActivationProposal): void;
  remove(code: string): boolean;
  list(): DefaultActivationProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultActivationProposalStore implements DefaultActivationProposalStore {
  items: Map<string, DefaultActivationProposal>;
  order: string[];

  constructor(items: Map<string, DefaultActivationProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultActivationProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultActivationProposal): void {
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

  list(): DefaultActivationProposal[] {
    const out: DefaultActivationProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultActivationProposalStore(): DefaultActivationProposalStore {
  return new MemoryDefaultActivationProposalStore(new Map<string, DefaultActivationProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultActivationProposalStore implements DefaultActivationProposalStore {
  inner: DefaultActivationProposalStore;
  cache: cache.TtlCache<DefaultActivationProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultActivationProposalStore,
    cacheValue: cache.TtlCache<DefaultActivationProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultActivationProposal | undefined {
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

  save(item: DefaultActivationProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultActivationProposal[] {
    return this.inner.list();
  }
}

export function newCachedDefaultActivationProposalStore(inner: DefaultActivationProposalStore, ttl: number, clockValue: clock.Clock): DefaultActivationProposalStore {
  return new CachedDefaultActivationProposalStore(
    inner,
    cache.newTtlCache<DefaultActivationProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default activation proposals. Empty fields match all. */
export class DefaultActivationProposalQuery {
  region: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minClicks: number, statuses: string[], limit: number) {
    this.region = region;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultActivationProposal): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultActivationProposal[]): DefaultActivationProposal[] {
    const matched = collections.filter(items, (candidate: DefaultActivationProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultActivationProposals(store: DefaultActivationProposalStore, query: DefaultActivationProposalQuery): DefaultActivationProposal[] {
  return query.apply(store.list());
}
