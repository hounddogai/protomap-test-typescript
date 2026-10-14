import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutScore } from "./payout-score.js";

/** Keeps payout scores by code. */
export interface PayoutScoreStore {
  find(code: string): PayoutScore | undefined;
  save(item: PayoutScore): void;
  remove(code: string): boolean;
  list(): PayoutScore[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutScoreStore implements PayoutScoreStore {
  items: Map<string, PayoutScore>;
  order: string[];

  constructor(items: Map<string, PayoutScore>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutScore | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutScore): void {
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

  list(): PayoutScore[] {
    const out: PayoutScore[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutScoreStore(): PayoutScoreStore {
  return new MemoryPayoutScoreStore(new Map<string, PayoutScore>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutScoreStore implements PayoutScoreStore {
  inner: PayoutScoreStore;
  cache: cache.TtlCache<PayoutScore>;
  hits: number;
  misses: number;

  constructor(inner: PayoutScoreStore, cacheValue: cache.TtlCache<PayoutScore>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutScore | undefined {
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

  save(item: PayoutScore): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutScore[] {
    return this.inner.list();
  }
}

export function newCachedPayoutScoreStore(inner: PayoutScoreStore, ttl: number, clockValue: clock.Clock): PayoutScoreStore {
  return new CachedPayoutScoreStore(inner, cache.newTtlCache<PayoutScore>(128, ttl, clockValue), 0, 0);
}

/** Selects payout scores. Empty fields match all. */
export class PayoutScoreQuery {
  title: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRevision: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutScore): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutScore[]): PayoutScore[] {
    const matched = collections.filter(items, (candidate: PayoutScore): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutScores(store: PayoutScoreStore, query: PayoutScoreQuery): PayoutScore[] {
  return query.apply(store.list());
}
