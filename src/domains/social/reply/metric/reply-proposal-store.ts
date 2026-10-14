import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ReplyProposal } from "./reply-proposal.js";

/** Keeps reply proposals by code. */
export interface ReplyProposalStore {
  find(code: string): ReplyProposal | undefined;
  save(item: ReplyProposal): void;
  remove(code: string): boolean;
  list(): ReplyProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryReplyProposalStore implements ReplyProposalStore {
  items: Map<string, ReplyProposal>;
  order: string[];

  constructor(items: Map<string, ReplyProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ReplyProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ReplyProposal): void {
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

  list(): ReplyProposal[] {
    const out: ReplyProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryReplyProposalStore(): ReplyProposalStore {
  return new MemoryReplyProposalStore(new Map<string, ReplyProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedReplyProposalStore implements ReplyProposalStore {
  inner: ReplyProposalStore;
  cache: cache.TtlCache<ReplyProposal>;
  hits: number;
  misses: number;

  constructor(inner: ReplyProposalStore, cacheValue: cache.TtlCache<ReplyProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ReplyProposal | undefined {
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

  save(item: ReplyProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ReplyProposal[] {
    return this.inner.list();
  }
}

export function newCachedReplyProposalStore(inner: ReplyProposalStore, ttl: number, clockValue: clock.Clock): ReplyProposalStore {
  return new CachedReplyProposalStore(inner, cache.newTtlCache<ReplyProposal>(512, ttl, clockValue), 0, 0);
}

/** Selects reply proposals. Empty fields match all. */
export class ReplyProposalQuery {
  locale: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFloorValue: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ReplyProposal): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ReplyProposal[]): ReplyProposal[] {
    const matched = collections.filter(items, (candidate: ReplyProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findReplyProposals(store: ReplyProposalStore, query: ReplyProposalQuery): ReplyProposal[] {
  return query.apply(store.list());
}
