import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientInviteEstimate } from "./lenient-invite-estimate.js";

/** Keeps lenient invite estimates by code. */
export interface LenientInviteEstimateStore {
  find(code: string): LenientInviteEstimate | undefined;
  save(item: LenientInviteEstimate): void;
  remove(code: string): boolean;
  list(): LenientInviteEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientInviteEstimateStore implements LenientInviteEstimateStore {
  items: Map<string, LenientInviteEstimate>;
  order: string[];

  constructor(items: Map<string, LenientInviteEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientInviteEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientInviteEstimate): void {
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

  list(): LenientInviteEstimate[] {
    const out: LenientInviteEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientInviteEstimateStore(): LenientInviteEstimateStore {
  return new MemoryLenientInviteEstimateStore(new Map<string, LenientInviteEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientInviteEstimateStore implements LenientInviteEstimateStore {
  inner: LenientInviteEstimateStore;
  cache: cache.TtlCache<LenientInviteEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientInviteEstimateStore,
    cacheValue: cache.TtlCache<LenientInviteEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientInviteEstimate | undefined {
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

  save(item: LenientInviteEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientInviteEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLenientInviteEstimateStore(inner: LenientInviteEstimateStore, ttl: number, clockValue: clock.Clock): LenientInviteEstimateStore {
  return new CachedLenientInviteEstimateStore(
    inner,
    cache.newTtlCache<LenientInviteEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient invite estimates. Empty fields match all. */
export class LenientInviteEstimateQuery {
  title: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minAmount: number, statuses: string[], limit: number) {
    this.title = title;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientInviteEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientInviteEstimate[]): LenientInviteEstimate[] {
    const matched = collections.filter(items, (candidate: LenientInviteEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientInviteEstimates(store: LenientInviteEstimateStore, query: LenientInviteEstimateQuery): LenientInviteEstimate[] {
  return query.apply(store.list());
}
