import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupClaim } from "./warmup-claim.js";

/** Keeps warmup claims by code. */
export interface WarmupClaimStore {
  find(code: string): WarmupClaim | undefined;
  save(item: WarmupClaim): void;
  remove(code: string): boolean;
  list(): WarmupClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupClaimStore implements WarmupClaimStore {
  items: Map<string, WarmupClaim>;
  order: string[];

  constructor(items: Map<string, WarmupClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupClaim): void {
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

  list(): WarmupClaim[] {
    const out: WarmupClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupClaimStore(): WarmupClaimStore {
  return new MemoryWarmupClaimStore(new Map<string, WarmupClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupClaimStore implements WarmupClaimStore {
  inner: WarmupClaimStore;
  cache: cache.TtlCache<WarmupClaim>;
  hits: number;
  misses: number;

  constructor(inner: WarmupClaimStore, cacheValue: cache.TtlCache<WarmupClaim>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupClaim | undefined {
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

  save(item: WarmupClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupClaim[] {
    return this.inner.list();
  }
}

export function newCachedWarmupClaimStore(inner: WarmupClaimStore, ttl: number, clockValue: clock.Clock): WarmupClaimStore {
  return new CachedWarmupClaimStore(inner, cache.newTtlCache<WarmupClaim>(128, ttl, clockValue), 0, 0);
}

/** Selects warmup claims. Empty fields match all. */
export class WarmupClaimQuery {
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

  matches(item: WarmupClaim): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupClaim[]): WarmupClaim[] {
    const matched = collections.filter(items, (candidate: WarmupClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupClaims(store: WarmupClaimStore, query: WarmupClaimQuery): WarmupClaim[] {
  return query.apply(store.list());
}
