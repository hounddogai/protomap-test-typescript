import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

/** Keeps adaptive invite proposals by code. */
export interface AdaptiveInviteProposalStore {
  find(code: string): AdaptiveInviteProposal | undefined;
  save(item: AdaptiveInviteProposal): void;
  remove(code: string): boolean;
  list(): AdaptiveInviteProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveInviteProposalStore implements AdaptiveInviteProposalStore {
  items: Map<string, AdaptiveInviteProposal>;
  order: string[];

  constructor(items: Map<string, AdaptiveInviteProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveInviteProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveInviteProposal): void {
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

  list(): AdaptiveInviteProposal[] {
    const out: AdaptiveInviteProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveInviteProposalStore(): AdaptiveInviteProposalStore {
  return new MemoryAdaptiveInviteProposalStore(new Map<string, AdaptiveInviteProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveInviteProposalStore implements AdaptiveInviteProposalStore {
  inner: AdaptiveInviteProposalStore;
  cache: cache.TtlCache<AdaptiveInviteProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveInviteProposalStore,
    cacheValue: cache.TtlCache<AdaptiveInviteProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveInviteProposal | undefined {
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

  save(item: AdaptiveInviteProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveInviteProposal[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveInviteProposalStore(inner: AdaptiveInviteProposalStore, ttl: number, clockValue: clock.Clock): AdaptiveInviteProposalStore {
  return new CachedAdaptiveInviteProposalStore(
    inner,
    cache.newTtlCache<AdaptiveInviteProposal>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive invite proposals. Empty fields match all. */
export class AdaptiveInviteProposalQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveInviteProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveInviteProposal[]): AdaptiveInviteProposal[] {
    const matched = collections.filter(items, (candidate: AdaptiveInviteProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveInviteProposals(store: AdaptiveInviteProposalStore, query: AdaptiveInviteProposalQuery): AdaptiveInviteProposal[] {
  return query.apply(store.list());
}
