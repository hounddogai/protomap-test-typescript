import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPathDraft } from "./primary-path-draft.js";

/** Keeps primary path drafts by code. */
export interface PrimaryPathDraftStore {
  find(code: string): PrimaryPathDraft | undefined;
  save(item: PrimaryPathDraft): void;
  remove(code: string): boolean;
  list(): PrimaryPathDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPathDraftStore implements PrimaryPathDraftStore {
  items: Map<string, PrimaryPathDraft>;
  order: string[];

  constructor(items: Map<string, PrimaryPathDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPathDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPathDraft): void {
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

  list(): PrimaryPathDraft[] {
    const out: PrimaryPathDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPathDraftStore(): PrimaryPathDraftStore {
  return new MemoryPrimaryPathDraftStore(new Map<string, PrimaryPathDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPathDraftStore implements PrimaryPathDraftStore {
  inner: PrimaryPathDraftStore;
  cache: cache.TtlCache<PrimaryPathDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPathDraftStore,
    cacheValue: cache.TtlCache<PrimaryPathDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPathDraft | undefined {
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

  save(item: PrimaryPathDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPathDraft[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPathDraftStore(inner: PrimaryPathDraftStore, ttl: number, clockValue: clock.Clock): PrimaryPathDraftStore {
  return new CachedPrimaryPathDraftStore(inner, cache.newTtlCache<PrimaryPathDraft>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary path drafts. Empty fields match all. */
export class PrimaryPathDraftQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPathDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPathDraft[]): PrimaryPathDraft[] {
    const matched = collections.filter(items, (candidate: PrimaryPathDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPathDrafts(store: PrimaryPathDraftStore, query: PrimaryPathDraftQuery): PrimaryPathDraft[] {
  return query.apply(store.list());
}
