import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { QueueProposal } from "./queue-proposal.js";

/** Keeps queue proposals by code. */
export interface QueueProposalStore {
  find(code: string): QueueProposal | undefined;
  save(item: QueueProposal): void;
  remove(code: string): boolean;
  list(): QueueProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryQueueProposalStore implements QueueProposalStore {
  items: Map<string, QueueProposal>;
  order: string[];

  constructor(items: Map<string, QueueProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): QueueProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: QueueProposal): void {
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

  list(): QueueProposal[] {
    const out: QueueProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryQueueProposalStore(): QueueProposalStore {
  return new MemoryQueueProposalStore(new Map<string, QueueProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedQueueProposalStore implements QueueProposalStore {
  inner: QueueProposalStore;
  cache: cache.TtlCache<QueueProposal>;
  hits: number;
  misses: number;

  constructor(inner: QueueProposalStore, cacheValue: cache.TtlCache<QueueProposal>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): QueueProposal | undefined {
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

  save(item: QueueProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): QueueProposal[] {
    return this.inner.list();
  }
}

export function newCachedQueueProposalStore(inner: QueueProposalStore, ttl: number, clockValue: clock.Clock): QueueProposalStore {
  return new CachedQueueProposalStore(inner, cache.newTtlCache<QueueProposal>(64, ttl, clockValue), 0, 0);
}

/** Selects queue proposals. Empty fields match all. */
export class QueueProposalQuery {
  source: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: QueueProposal): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: QueueProposal[]): QueueProposal[] {
    const matched = collections.filter(items, (candidate: QueueProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findQueueProposals(store: QueueProposalStore, query: QueueProposalQuery): QueueProposal[] {
  return query.apply(store.list());
}
