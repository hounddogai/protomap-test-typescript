import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallDraft } from "./paywall-draft.js";

/** Keeps paywall drafts by code. */
export interface PaywallDraftStore {
  find(code: string): PaywallDraft | undefined;
  save(item: PaywallDraft): void;
  remove(code: string): boolean;
  list(): PaywallDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallDraftStore implements PaywallDraftStore {
  items: Map<string, PaywallDraft>;
  order: string[];

  constructor(items: Map<string, PaywallDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallDraft): void {
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

  list(): PaywallDraft[] {
    const out: PaywallDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallDraftStore(): PaywallDraftStore {
  return new MemoryPaywallDraftStore(new Map<string, PaywallDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallDraftStore implements PaywallDraftStore {
  inner: PaywallDraftStore;
  cache: cache.TtlCache<PaywallDraft>;
  hits: number;
  misses: number;

  constructor(inner: PaywallDraftStore, cacheValue: cache.TtlCache<PaywallDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallDraft | undefined {
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

  save(item: PaywallDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallDraft[] {
    return this.inner.list();
  }
}

export function newCachedPaywallDraftStore(inner: PaywallDraftStore, ttl: number, clockValue: clock.Clock): PaywallDraftStore {
  return new CachedPaywallDraftStore(inner, cache.newTtlCache<PaywallDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall drafts. Empty fields match all. */
export class PaywallDraftQuery {
  name: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallDraft[]): PaywallDraft[] {
    const matched = collections.filter(items, (candidate: PaywallDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallDrafts(store: PaywallDraftStore, query: PaywallDraftQuery): PaywallDraft[] {
  return query.apply(store.list());
}
