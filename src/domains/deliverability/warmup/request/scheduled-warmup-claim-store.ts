import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWarmupClaim } from "./scheduled-warmup-claim.js";

/** Keeps scheduled warmup claims by code. */
export interface ScheduledWarmupClaimStore {
  find(code: string): ScheduledWarmupClaim | undefined;
  save(item: ScheduledWarmupClaim): void;
  remove(code: string): boolean;
  list(): ScheduledWarmupClaim[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWarmupClaimStore implements ScheduledWarmupClaimStore {
  items: Map<string, ScheduledWarmupClaim>;
  order: string[];

  constructor(items: Map<string, ScheduledWarmupClaim>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWarmupClaim | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWarmupClaim): void {
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

  list(): ScheduledWarmupClaim[] {
    const out: ScheduledWarmupClaim[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWarmupClaimStore(): ScheduledWarmupClaimStore {
  return new MemoryScheduledWarmupClaimStore(new Map<string, ScheduledWarmupClaim>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWarmupClaimStore implements ScheduledWarmupClaimStore {
  inner: ScheduledWarmupClaimStore;
  cache: cache.TtlCache<ScheduledWarmupClaim>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWarmupClaimStore,
    cacheValue: cache.TtlCache<ScheduledWarmupClaim>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWarmupClaim | undefined {
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

  save(item: ScheduledWarmupClaim): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWarmupClaim[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWarmupClaimStore(inner: ScheduledWarmupClaimStore, ttl: number, clockValue: clock.Clock): ScheduledWarmupClaimStore {
  return new CachedScheduledWarmupClaimStore(
    inner,
    cache.newTtlCache<ScheduledWarmupClaim>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled warmup claims. Empty fields match all. */
export class ScheduledWarmupClaimQuery {
  locale: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSendAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWarmupClaim): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWarmupClaim[]): ScheduledWarmupClaim[] {
    const matched = collections.filter(items, (candidate: ScheduledWarmupClaim): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWarmupClaims(store: ScheduledWarmupClaimStore, query: ScheduledWarmupClaimQuery): ScheduledWarmupClaim[] {
  return query.apply(store.list());
}
