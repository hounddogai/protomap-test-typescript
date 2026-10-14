import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutTarget } from "./payout-target.js";

/** Keeps payout targets by code. */
export interface PayoutTargetStore {
  find(code: string): PayoutTarget | undefined;
  save(item: PayoutTarget): void;
  remove(code: string): boolean;
  list(): PayoutTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutTargetStore implements PayoutTargetStore {
  items: Map<string, PayoutTarget>;
  order: string[];

  constructor(items: Map<string, PayoutTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutTarget): void {
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

  list(): PayoutTarget[] {
    const out: PayoutTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutTargetStore(): PayoutTargetStore {
  return new MemoryPayoutTargetStore(new Map<string, PayoutTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutTargetStore implements PayoutTargetStore {
  inner: PayoutTargetStore;
  cache: cache.TtlCache<PayoutTarget>;
  hits: number;
  misses: number;

  constructor(inner: PayoutTargetStore, cacheValue: cache.TtlCache<PayoutTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutTarget | undefined {
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

  save(item: PayoutTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutTarget[] {
    return this.inner.list();
  }
}

export function newCachedPayoutTargetStore(inner: PayoutTargetStore, ttl: number, clockValue: clock.Clock): PayoutTargetStore {
  return new CachedPayoutTargetStore(inner, cache.newTtlCache<PayoutTarget>(64, ttl, clockValue), 0, 0);
}

/** Selects payout targets. Empty fields match all. */
export class PayoutTargetQuery {
  region: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minPriority: number, statuses: string[], limit: number) {
    this.region = region;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutTarget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutTarget[]): PayoutTarget[] {
    const matched = collections.filter(items, (candidate: PayoutTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutTargets(store: PayoutTargetStore, query: PayoutTargetQuery): PayoutTarget[] {
  return query.apply(store.list());
}
