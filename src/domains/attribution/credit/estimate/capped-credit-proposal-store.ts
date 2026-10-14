import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCreditProposal } from "./capped-credit-proposal.js";

/** Keeps capped credit proposals by code. */
export interface CappedCreditProposalStore {
  find(code: string): CappedCreditProposal | undefined;
  save(item: CappedCreditProposal): void;
  remove(code: string): boolean;
  list(): CappedCreditProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCreditProposalStore implements CappedCreditProposalStore {
  items: Map<string, CappedCreditProposal>;
  order: string[];

  constructor(items: Map<string, CappedCreditProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCreditProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCreditProposal): void {
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

  list(): CappedCreditProposal[] {
    const out: CappedCreditProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCreditProposalStore(): CappedCreditProposalStore {
  return new MemoryCappedCreditProposalStore(new Map<string, CappedCreditProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCreditProposalStore implements CappedCreditProposalStore {
  inner: CappedCreditProposalStore;
  cache: cache.TtlCache<CappedCreditProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCreditProposalStore,
    cacheValue: cache.TtlCache<CappedCreditProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCreditProposal | undefined {
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

  save(item: CappedCreditProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCreditProposal[] {
    return this.inner.list();
  }
}

export function newCachedCappedCreditProposalStore(inner: CappedCreditProposalStore, ttl: number, clockValue: clock.Clock): CappedCreditProposalStore {
  return new CachedCappedCreditProposalStore(
    inner,
    cache.newTtlCache<CappedCreditProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects capped credit proposals. Empty fields match all. */
export class CappedCreditProposalQuery {
  name: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minVersion: number, statuses: string[], limit: number) {
    this.name = name;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCreditProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCreditProposal[]): CappedCreditProposal[] {
    const matched = collections.filter(items, (candidate: CappedCreditProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCreditProposals(store: CappedCreditProposalStore, query: CappedCreditProposalQuery): CappedCreditProposal[] {
  return query.apply(store.list());
}
