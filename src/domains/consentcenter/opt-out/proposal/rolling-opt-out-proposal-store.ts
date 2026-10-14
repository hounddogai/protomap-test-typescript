import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingOptOutProposal } from "./rolling-opt-out-proposal.js";

/** Keeps rolling opt out proposals by code. */
export interface RollingOptOutProposalStore {
  find(code: string): RollingOptOutProposal | undefined;
  save(item: RollingOptOutProposal): void;
  remove(code: string): boolean;
  list(): RollingOptOutProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingOptOutProposalStore implements RollingOptOutProposalStore {
  items: Map<string, RollingOptOutProposal>;
  order: string[];

  constructor(items: Map<string, RollingOptOutProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingOptOutProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingOptOutProposal): void {
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

  list(): RollingOptOutProposal[] {
    const out: RollingOptOutProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingOptOutProposalStore(): RollingOptOutProposalStore {
  return new MemoryRollingOptOutProposalStore(new Map<string, RollingOptOutProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingOptOutProposalStore implements RollingOptOutProposalStore {
  inner: RollingOptOutProposalStore;
  cache: cache.TtlCache<RollingOptOutProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingOptOutProposalStore,
    cacheValue: cache.TtlCache<RollingOptOutProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingOptOutProposal | undefined {
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

  save(item: RollingOptOutProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingOptOutProposal[] {
    return this.inner.list();
  }
}

export function newCachedRollingOptOutProposalStore(inner: RollingOptOutProposalStore, ttl: number, clockValue: clock.Clock): RollingOptOutProposalStore {
  return new CachedRollingOptOutProposalStore(
    inner,
    cache.newTtlCache<RollingOptOutProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling opt out proposals. Empty fields match all. */
export class RollingOptOutProposalQuery {
  segment: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMaximum: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingOptOutProposal): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingOptOutProposal[]): RollingOptOutProposal[] {
    const matched = collections.filter(items, (candidate: RollingOptOutProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingOptOutProposals(store: RollingOptOutProposalStore, query: RollingOptOutProposalQuery): RollingOptOutProposal[] {
  return query.apply(store.list());
}
