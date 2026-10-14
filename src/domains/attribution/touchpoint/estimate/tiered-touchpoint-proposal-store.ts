import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTouchpointProposal } from "./tiered-touchpoint-proposal.js";

/** Keeps tiered touchpoint proposals by code. */
export interface TieredTouchpointProposalStore {
  find(code: string): TieredTouchpointProposal | undefined;
  save(item: TieredTouchpointProposal): void;
  remove(code: string): boolean;
  list(): TieredTouchpointProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTouchpointProposalStore implements TieredTouchpointProposalStore {
  items: Map<string, TieredTouchpointProposal>;
  order: string[];

  constructor(items: Map<string, TieredTouchpointProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTouchpointProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTouchpointProposal): void {
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

  list(): TieredTouchpointProposal[] {
    const out: TieredTouchpointProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTouchpointProposalStore(): TieredTouchpointProposalStore {
  return new MemoryTieredTouchpointProposalStore(new Map<string, TieredTouchpointProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTouchpointProposalStore implements TieredTouchpointProposalStore {
  inner: TieredTouchpointProposalStore;
  cache: cache.TtlCache<TieredTouchpointProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTouchpointProposalStore,
    cacheValue: cache.TtlCache<TieredTouchpointProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTouchpointProposal | undefined {
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

  save(item: TieredTouchpointProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTouchpointProposal[] {
    return this.inner.list();
  }
}

export function newCachedTieredTouchpointProposalStore(inner: TieredTouchpointProposalStore, ttl: number, clockValue: clock.Clock): TieredTouchpointProposalStore {
  return new CachedTieredTouchpointProposalStore(
    inner,
    cache.newTtlCache<TieredTouchpointProposal>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered touchpoint proposals. Empty fields match all. */
export class TieredTouchpointProposalQuery {
  segment: string;
  minVersion: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minVersion: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minVersion = minVersion;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTouchpointProposal): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.version < this.minVersion) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTouchpointProposal[]): TieredTouchpointProposal[] {
    const matched = collections.filter(items, (candidate: TieredTouchpointProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTouchpointProposals(store: TieredTouchpointProposalStore, query: TieredTouchpointProposalQuery): TieredTouchpointProposal[] {
  return query.apply(store.list());
}
