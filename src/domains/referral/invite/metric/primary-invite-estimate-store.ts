import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryInviteEstimate } from "./primary-invite-estimate.js";

/** Keeps primary invite estimates by code. */
export interface PrimaryInviteEstimateStore {
  find(code: string): PrimaryInviteEstimate | undefined;
  save(item: PrimaryInviteEstimate): void;
  remove(code: string): boolean;
  list(): PrimaryInviteEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryInviteEstimateStore implements PrimaryInviteEstimateStore {
  items: Map<string, PrimaryInviteEstimate>;
  order: string[];

  constructor(items: Map<string, PrimaryInviteEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryInviteEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryInviteEstimate): void {
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

  list(): PrimaryInviteEstimate[] {
    const out: PrimaryInviteEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryInviteEstimateStore(): PrimaryInviteEstimateStore {
  return new MemoryPrimaryInviteEstimateStore(new Map<string, PrimaryInviteEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryInviteEstimateStore implements PrimaryInviteEstimateStore {
  inner: PrimaryInviteEstimateStore;
  cache: cache.TtlCache<PrimaryInviteEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryInviteEstimateStore,
    cacheValue: cache.TtlCache<PrimaryInviteEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryInviteEstimate | undefined {
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

  save(item: PrimaryInviteEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryInviteEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryInviteEstimateStore(inner: PrimaryInviteEstimateStore, ttl: number, clockValue: clock.Clock): PrimaryInviteEstimateStore {
  return new CachedPrimaryInviteEstimateStore(
    inner,
    cache.newTtlCache<PrimaryInviteEstimate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary invite estimates. Empty fields match all. */
export class PrimaryInviteEstimateQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryInviteEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryInviteEstimate[]): PrimaryInviteEstimate[] {
    const matched = collections.filter(items, (candidate: PrimaryInviteEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryInviteEstimates(store: PrimaryInviteEstimateStore, query: PrimaryInviteEstimateQuery): PrimaryInviteEstimate[] {
  return query.apply(store.list());
}
