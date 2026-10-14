import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallNotice } from "./paywall-notice.js";

/** Keeps paywall notices by code. */
export interface PaywallNoticeStore {
  find(code: string): PaywallNotice | undefined;
  save(item: PaywallNotice): void;
  remove(code: string): boolean;
  list(): PaywallNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallNoticeStore implements PaywallNoticeStore {
  items: Map<string, PaywallNotice>;
  order: string[];

  constructor(items: Map<string, PaywallNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallNotice): void {
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

  list(): PaywallNotice[] {
    const out: PaywallNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallNoticeStore(): PaywallNoticeStore {
  return new MemoryPaywallNoticeStore(new Map<string, PaywallNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallNoticeStore implements PaywallNoticeStore {
  inner: PaywallNoticeStore;
  cache: cache.TtlCache<PaywallNotice>;
  hits: number;
  misses: number;

  constructor(inner: PaywallNoticeStore, cacheValue: cache.TtlCache<PaywallNotice>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallNotice | undefined {
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

  save(item: PaywallNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallNotice[] {
    return this.inner.list();
  }
}

export function newCachedPaywallNoticeStore(inner: PaywallNoticeStore, ttl: number, clockValue: clock.Clock): PaywallNoticeStore {
  return new CachedPaywallNoticeStore(inner, cache.newTtlCache<PaywallNotice>(1024, ttl, clockValue), 0, 0);
}

/** Selects paywall notices. Empty fields match all. */
export class PaywallNoticeQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallNotice[]): PaywallNotice[] {
    const matched = collections.filter(items, (candidate: PaywallNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallNotices(store: PaywallNoticeStore, query: PaywallNoticeQuery): PaywallNotice[] {
  return query.apply(store.list());
}
