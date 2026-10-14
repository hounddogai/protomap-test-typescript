import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictMacroProposal } from "./strict-macro-proposal.js";

/** Keeps strict macro proposals by code. */
export interface StrictMacroProposalStore {
  find(code: string): StrictMacroProposal | undefined;
  save(item: StrictMacroProposal): void;
  remove(code: string): boolean;
  list(): StrictMacroProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictMacroProposalStore implements StrictMacroProposalStore {
  items: Map<string, StrictMacroProposal>;
  order: string[];

  constructor(items: Map<string, StrictMacroProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictMacroProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictMacroProposal): void {
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

  list(): StrictMacroProposal[] {
    const out: StrictMacroProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictMacroProposalStore(): StrictMacroProposalStore {
  return new MemoryStrictMacroProposalStore(new Map<string, StrictMacroProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictMacroProposalStore implements StrictMacroProposalStore {
  inner: StrictMacroProposalStore;
  cache: cache.TtlCache<StrictMacroProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictMacroProposalStore,
    cacheValue: cache.TtlCache<StrictMacroProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictMacroProposal | undefined {
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

  save(item: StrictMacroProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictMacroProposal[] {
    return this.inner.list();
  }
}

export function newCachedStrictMacroProposalStore(inner: StrictMacroProposalStore, ttl: number, clockValue: clock.Clock): StrictMacroProposalStore {
  return new CachedStrictMacroProposalStore(inner, cache.newTtlCache<StrictMacroProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects strict macro proposals. Empty fields match all. */
export class StrictMacroProposalQuery {
  name: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictMacroProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictMacroProposal[]): StrictMacroProposal[] {
    const matched = collections.filter(items, (candidate: StrictMacroProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictMacroProposals(store: StrictMacroProposalStore, query: StrictMacroProposalQuery): StrictMacroProposal[] {
  return query.apply(store.list());
}
