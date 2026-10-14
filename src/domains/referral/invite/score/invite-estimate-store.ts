import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InviteEstimate } from "./invite-estimate.js";

/** Keeps invite estimates by code. */
export interface InviteEstimateStore {
  find(code: string): InviteEstimate | undefined;
  save(item: InviteEstimate): void;
  remove(code: string): boolean;
  list(): InviteEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInviteEstimateStore implements InviteEstimateStore {
  items: Map<string, InviteEstimate>;
  order: string[];

  constructor(items: Map<string, InviteEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InviteEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InviteEstimate): void {
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

  list(): InviteEstimate[] {
    const out: InviteEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInviteEstimateStore(): InviteEstimateStore {
  return new MemoryInviteEstimateStore(new Map<string, InviteEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInviteEstimateStore implements InviteEstimateStore {
  inner: InviteEstimateStore;
  cache: cache.TtlCache<InviteEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: InviteEstimateStore,
    cacheValue: cache.TtlCache<InviteEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InviteEstimate | undefined {
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

  save(item: InviteEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InviteEstimate[] {
    return this.inner.list();
  }
}

export function newCachedInviteEstimateStore(inner: InviteEstimateStore, ttl: number, clockValue: clock.Clock): InviteEstimateStore {
  return new CachedInviteEstimateStore(inner, cache.newTtlCache<InviteEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects invite estimates. Empty fields match all. */
export class InviteEstimateQuery {
  segment: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InviteEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InviteEstimate[]): InviteEstimate[] {
    const matched = collections.filter(items, (candidate: InviteEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInviteEstimates(store: InviteEstimateStore, query: InviteEstimateQuery): InviteEstimate[] {
  return query.apply(store.list());
}
