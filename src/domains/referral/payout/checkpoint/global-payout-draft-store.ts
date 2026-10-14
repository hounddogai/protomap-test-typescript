import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPayoutDraft } from "./global-payout-draft.js";

/** Keeps global payout drafts by code. */
export interface GlobalPayoutDraftStore {
  find(code: string): GlobalPayoutDraft | undefined;
  save(item: GlobalPayoutDraft): void;
  remove(code: string): boolean;
  list(): GlobalPayoutDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPayoutDraftStore implements GlobalPayoutDraftStore {
  items: Map<string, GlobalPayoutDraft>;
  order: string[];

  constructor(items: Map<string, GlobalPayoutDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPayoutDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPayoutDraft): void {
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

  list(): GlobalPayoutDraft[] {
    const out: GlobalPayoutDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPayoutDraftStore(): GlobalPayoutDraftStore {
  return new MemoryGlobalPayoutDraftStore(new Map<string, GlobalPayoutDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPayoutDraftStore implements GlobalPayoutDraftStore {
  inner: GlobalPayoutDraftStore;
  cache: cache.TtlCache<GlobalPayoutDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPayoutDraftStore,
    cacheValue: cache.TtlCache<GlobalPayoutDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPayoutDraft | undefined {
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

  save(item: GlobalPayoutDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPayoutDraft[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPayoutDraftStore(inner: GlobalPayoutDraftStore, ttl: number, clockValue: clock.Clock): GlobalPayoutDraftStore {
  return new CachedGlobalPayoutDraftStore(inner, cache.newTtlCache<GlobalPayoutDraft>(128, ttl, clockValue), 0, 0);
}

/** Selects global payout drafts. Empty fields match all. */
export class GlobalPayoutDraftQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPayoutDraft): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPayoutDraft[]): GlobalPayoutDraft[] {
    const matched = collections.filter(items, (candidate: GlobalPayoutDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPayoutDrafts(store: GlobalPayoutDraftStore, query: GlobalPayoutDraftQuery): GlobalPayoutDraft[] {
  return query.apply(store.list());
}
