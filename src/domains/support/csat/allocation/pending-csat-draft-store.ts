import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingCsatDraft } from "./pending-csat-draft.js";

/** Keeps pending csat drafts by code. */
export interface PendingCsatDraftStore {
  find(code: string): PendingCsatDraft | undefined;
  save(item: PendingCsatDraft): void;
  remove(code: string): boolean;
  list(): PendingCsatDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingCsatDraftStore implements PendingCsatDraftStore {
  items: Map<string, PendingCsatDraft>;
  order: string[];

  constructor(items: Map<string, PendingCsatDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingCsatDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingCsatDraft): void {
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

  list(): PendingCsatDraft[] {
    const out: PendingCsatDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingCsatDraftStore(): PendingCsatDraftStore {
  return new MemoryPendingCsatDraftStore(new Map<string, PendingCsatDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingCsatDraftStore implements PendingCsatDraftStore {
  inner: PendingCsatDraftStore;
  cache: cache.TtlCache<PendingCsatDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingCsatDraftStore,
    cacheValue: cache.TtlCache<PendingCsatDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingCsatDraft | undefined {
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

  save(item: PendingCsatDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingCsatDraft[] {
    return this.inner.list();
  }
}

export function newCachedPendingCsatDraftStore(inner: PendingCsatDraftStore, ttl: number, clockValue: clock.Clock): PendingCsatDraftStore {
  return new CachedPendingCsatDraftStore(inner, cache.newTtlCache<PendingCsatDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects pending csat drafts. Empty fields match all. */
export class PendingCsatDraftQuery {
  locale: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minAmount: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingCsatDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingCsatDraft[]): PendingCsatDraft[] {
    const matched = collections.filter(items, (candidate: PendingCsatDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingCsatDrafts(store: PendingCsatDraftStore, query: PendingCsatDraftQuery): PendingCsatDraft[] {
  return query.apply(store.list());
}
