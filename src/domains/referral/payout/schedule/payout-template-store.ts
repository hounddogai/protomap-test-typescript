import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutTemplate } from "./payout-template.js";

/** Keeps payout templates by code. */
export interface PayoutTemplateStore {
  find(code: string): PayoutTemplate | undefined;
  save(item: PayoutTemplate): void;
  remove(code: string): boolean;
  list(): PayoutTemplate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutTemplateStore implements PayoutTemplateStore {
  items: Map<string, PayoutTemplate>;
  order: string[];

  constructor(items: Map<string, PayoutTemplate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutTemplate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutTemplate): void {
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

  list(): PayoutTemplate[] {
    const out: PayoutTemplate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutTemplateStore(): PayoutTemplateStore {
  return new MemoryPayoutTemplateStore(new Map<string, PayoutTemplate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutTemplateStore implements PayoutTemplateStore {
  inner: PayoutTemplateStore;
  cache: cache.TtlCache<PayoutTemplate>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutTemplateStore,
    cacheValue: cache.TtlCache<PayoutTemplate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutTemplate | undefined {
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

  save(item: PayoutTemplate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutTemplate[] {
    return this.inner.list();
  }
}

export function newCachedPayoutTemplateStore(inner: PayoutTemplateStore, ttl: number, clockValue: clock.Clock): PayoutTemplateStore {
  return new CachedPayoutTemplateStore(inner, cache.newTtlCache<PayoutTemplate>(64, ttl, clockValue), 0, 0);
}

/** Selects payout templates. Empty fields match all. */
export class PayoutTemplateQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutTemplate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutTemplate[]): PayoutTemplate[] {
    const matched = collections.filter(items, (candidate: PayoutTemplate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutTemplates(store: PayoutTemplateStore, query: PayoutTemplateQuery): PayoutTemplate[] {
  return query.apply(store.list());
}
