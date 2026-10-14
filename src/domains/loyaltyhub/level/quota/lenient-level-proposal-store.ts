import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientLevelProposal } from "./lenient-level-proposal.js";

/** Keeps lenient level proposals by code. */
export interface LenientLevelProposalStore {
  find(code: string): LenientLevelProposal | undefined;
  save(item: LenientLevelProposal): void;
  remove(code: string): boolean;
  list(): LenientLevelProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientLevelProposalStore implements LenientLevelProposalStore {
  items: Map<string, LenientLevelProposal>;
  order: string[];

  constructor(items: Map<string, LenientLevelProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientLevelProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientLevelProposal): void {
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

  list(): LenientLevelProposal[] {
    const out: LenientLevelProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientLevelProposalStore(): LenientLevelProposalStore {
  return new MemoryLenientLevelProposalStore(new Map<string, LenientLevelProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientLevelProposalStore implements LenientLevelProposalStore {
  inner: LenientLevelProposalStore;
  cache: cache.TtlCache<LenientLevelProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientLevelProposalStore,
    cacheValue: cache.TtlCache<LenientLevelProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientLevelProposal | undefined {
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

  save(item: LenientLevelProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientLevelProposal[] {
    return this.inner.list();
  }
}

export function newCachedLenientLevelProposalStore(inner: LenientLevelProposalStore, ttl: number, clockValue: clock.Clock): LenientLevelProposalStore {
  return new CachedLenientLevelProposalStore(
    inner,
    cache.newTtlCache<LenientLevelProposal>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient level proposals. Empty fields match all. */
export class LenientLevelProposalQuery {
  label: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minStartsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientLevelProposal): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientLevelProposal[]): LenientLevelProposal[] {
    const matched = collections.filter(items, (candidate: LenientLevelProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientLevelProposals(store: LenientLevelProposalStore, query: LenientLevelProposalQuery): LenientLevelProposal[] {
  return query.apply(store.list());
}
