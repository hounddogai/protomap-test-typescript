import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutDraft } from "./payout-draft.js";

/** Keeps payout drafts by code. */
export interface PayoutDraftStore {
  find(code: string): PayoutDraft | undefined;
  save(item: PayoutDraft): void;
  remove(code: string): boolean;
  list(): PayoutDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutDraftStore implements PayoutDraftStore {
  items: Map<string, PayoutDraft>;
  order: string[];

  constructor(items: Map<string, PayoutDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutDraft): void {
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

  list(): PayoutDraft[] {
    const out: PayoutDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutDraftStore(): PayoutDraftStore {
  return new MemoryPayoutDraftStore(new Map<string, PayoutDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutDraftStore implements PayoutDraftStore {
  inner: PayoutDraftStore;
  cache: cache.TtlCache<PayoutDraft>;
  hits: number;
  misses: number;

  constructor(inner: PayoutDraftStore, cacheValue: cache.TtlCache<PayoutDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutDraft | undefined {
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

  save(item: PayoutDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutDraft[] {
    return this.inner.list();
  }
}

export function newCachedPayoutDraftStore(inner: PayoutDraftStore, ttl: number, clockValue: clock.Clock): PayoutDraftStore {
  return new CachedPayoutDraftStore(inner, cache.newTtlCache<PayoutDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects payout drafts. Empty fields match all. */
export class PayoutDraftQuery {
  label: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAmount: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutDraft[]): PayoutDraft[] {
    const matched = collections.filter(items, (candidate: PayoutDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutDrafts(store: PayoutDraftStore, query: PayoutDraftQuery): PayoutDraft[] {
  return query.apply(store.list());
}
