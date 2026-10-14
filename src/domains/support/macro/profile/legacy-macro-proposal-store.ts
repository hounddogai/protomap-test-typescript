import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyMacroProposal } from "./legacy-macro-proposal.js";

/** Keeps legacy macro proposals by code. */
export interface LegacyMacroProposalStore {
  find(code: string): LegacyMacroProposal | undefined;
  save(item: LegacyMacroProposal): void;
  remove(code: string): boolean;
  list(): LegacyMacroProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyMacroProposalStore implements LegacyMacroProposalStore {
  items: Map<string, LegacyMacroProposal>;
  order: string[];

  constructor(items: Map<string, LegacyMacroProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyMacroProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyMacroProposal): void {
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

  list(): LegacyMacroProposal[] {
    const out: LegacyMacroProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyMacroProposalStore(): LegacyMacroProposalStore {
  return new MemoryLegacyMacroProposalStore(new Map<string, LegacyMacroProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyMacroProposalStore implements LegacyMacroProposalStore {
  inner: LegacyMacroProposalStore;
  cache: cache.TtlCache<LegacyMacroProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyMacroProposalStore,
    cacheValue: cache.TtlCache<LegacyMacroProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyMacroProposal | undefined {
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

  save(item: LegacyMacroProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyMacroProposal[] {
    return this.inner.list();
  }
}

export function newCachedLegacyMacroProposalStore(inner: LegacyMacroProposalStore, ttl: number, clockValue: clock.Clock): LegacyMacroProposalStore {
  return new CachedLegacyMacroProposalStore(inner, cache.newTtlCache<LegacyMacroProposal>(128, ttl, clockValue), 0, 0);
}

/** Selects legacy macro proposals. Empty fields match all. */
export class LegacyMacroProposalQuery {
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

  matches(item: LegacyMacroProposal): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyMacroProposal[]): LegacyMacroProposal[] {
    const matched = collections.filter(items, (candidate: LegacyMacroProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyMacroProposals(store: LegacyMacroProposalStore, query: LegacyMacroProposalQuery): LegacyMacroProposal[] {
  return query.apply(store.list());
}
