import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

/** Keeps batched ticket view claims by code. */
export interface BatchedTicketViewClaimStore {
  find(code: string): BatchedTicketViewClaim | undefined;
  save(item: BatchedTicketViewClaim): void;
  remove(code: string): boolean;
  list(): BatchedTicketViewClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedTicketViewClaimStore implements BatchedTicketViewClaimStore {
  items: Map<string, BatchedTicketViewClaim>;
  order: string[];

  constructor(items: Map<string, BatchedTicketViewClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedTicketViewClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedTicketViewClaim): void {
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

  list(): BatchedTicketViewClaim[] {
    const out: BatchedTicketViewClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedTicketViewClaimStore(): BatchedTicketViewClaimStore {
  return new MemoryBatchedTicketViewClaimStore(new Map<string, BatchedTicketViewClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedTicketViewClaimStore implements BatchedTicketViewClaimStore {
  inner: BatchedTicketViewClaimStore;
  cache: cache.TtlCache<BatchedTicketViewClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedTicketViewClaimStore,
    cacheValue: cache.TtlCache<BatchedTicketViewClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedTicketViewClaim | undefined {
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

  save(item: BatchedTicketViewClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedTicketViewClaim[] {
    return this.inner.list();
  }
}

export function newCachedBatchedTicketViewClaimStore(inner: BatchedTicketViewClaimStore, ttl: number, clockValue: clock.Clock): BatchedTicketViewClaimStore {
  return new CachedBatchedTicketViewClaimStore(
    inner,
    cache.newTtlCache<BatchedTicketViewClaim>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched ticket view claims. Empty fields match all. */
export class BatchedTicketViewClaimQuery {
  category: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minSequence: number, statuses: string[], limit: number) {
    this.category = category;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedTicketViewClaim): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedTicketViewClaim[]): BatchedTicketViewClaim[] {
    const matched = collections.filter(items, (candidate: BatchedTicketViewClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedTicketViewClaims(store: BatchedTicketViewClaimStore, query: BatchedTicketViewClaimQuery): BatchedTicketViewClaim[] {
  return query.apply(store.list());
}
