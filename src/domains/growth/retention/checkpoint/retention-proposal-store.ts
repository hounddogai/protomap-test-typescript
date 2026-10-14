import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionProposal } from "./retention-proposal.js";

/** Keeps retention proposals by code. */
export interface RetentionProposalStore {
  find(code: string): RetentionProposal | undefined;
  save(item: RetentionProposal): void;
  remove(code: string): boolean;
  list(): RetentionProposal[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionProposalStore implements RetentionProposalStore {
  items: Map<string, RetentionProposal>;
  order: string[];

  constructor(items: Map<string, RetentionProposal>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionProposal | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionProposal): void {
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

  list(): RetentionProposal[] {
    const out: RetentionProposal[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionProposalStore(): RetentionProposalStore {
  return new MemoryRetentionProposalStore(new Map<string, RetentionProposal>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionProposalStore implements RetentionProposalStore {
  inner: RetentionProposalStore;
  cache: cache.TtlCache<RetentionProposal>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionProposalStore,
    cacheValue: cache.TtlCache<RetentionProposal>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionProposal | undefined {
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

  save(item: RetentionProposal): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionProposal[] {
    return this.inner.list();
  }
}

export function newCachedRetentionProposalStore(inner: RetentionProposalStore, ttl: number, clockValue: clock.Clock): RetentionProposalStore {
  return new CachedRetentionProposalStore(inner, cache.newTtlCache<RetentionProposal>(256, ttl, clockValue), 0, 0);
}

/** Selects retention proposals. Empty fields match all. */
export class RetentionProposalQuery {
  title: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCapacity: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionProposal): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionProposal[]): RetentionProposal[] {
    const matched = collections.filter(items, (candidate: RetentionProposal): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionProposals(store: RetentionProposalStore, query: RetentionProposalQuery): RetentionProposal[] {
  return query.apply(store.list());
}
