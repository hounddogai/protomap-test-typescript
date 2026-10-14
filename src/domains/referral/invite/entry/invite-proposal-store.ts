import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteProposal } from "./invite-proposal.js";

/** Keeps invite proposals by code. */
export interface InviteProposalStore {
  find(code: string): InviteProposal | undefined;
  save(item: InviteProposal): void;
  remove(code: string): boolean;
  list(): InviteProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteProposalStore implements InviteProposalStore {
  items: Map<string, InviteProposal>;
  order: string[];

  constructor(items: Map<string, InviteProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteProposal): void {
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

  list(): InviteProposal[] {
    const out: InviteProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteProposalStore(): InviteProposalStore {
  return new MemoryInviteProposalStore(new Map<string, InviteProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteProposalStore implements InviteProposalStore {
  inner: InviteProposalStore;
  cache: cache.TtlCache<InviteProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteProposalStore,
    cacheValue: cache.TtlCache<InviteProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteProposal | undefined {
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

  save(item: InviteProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteProposal[] {
    return this.inner.list();
  }
}

export function newCachedInviteProposalStore(inner: InviteProposalStore, ttl: number, clockValue: clock.Clock): InviteProposalStore {
  return new CachedInviteProposalStore(inner, cache.newTtlCache<InviteProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects invite proposals. Empty fields match all. */
export class InviteProposalQuery {
  title: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minSendAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteProposal[]): InviteProposal[] {
    const matched = collections.filter(items, (candidate: InviteProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteProposals(store: InviteProposalStore, query: InviteProposalQuery): InviteProposal[] {
  return query.apply(store.list());
}
