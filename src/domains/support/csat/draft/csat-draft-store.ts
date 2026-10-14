import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatDraft } from "./csat-draft.js";

/** Keeps csat drafts by code. */
export interface CsatDraftStore {
  find(code: string): CsatDraft | undefined;
  save(item: CsatDraft): void;
  remove(code: string): boolean;
  list(): CsatDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatDraftStore implements CsatDraftStore {
  items: Map<string, CsatDraft>;
  order: string[];

  constructor(items: Map<string, CsatDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatDraft): void {
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

  list(): CsatDraft[] {
    const out: CsatDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatDraftStore(): CsatDraftStore {
  return new MemoryCsatDraftStore(new Map<string, CsatDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatDraftStore implements CsatDraftStore {
  inner: CsatDraftStore;
  cache: cache.TtlCache<CsatDraft>;
  hits: number;
  misses: number;

  constructor(inner: CsatDraftStore, cacheValue: cache.TtlCache<CsatDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatDraft | undefined {
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

  save(item: CsatDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatDraft[] {
    return this.inner.list();
  }
}

export function newCachedCsatDraftStore(inner: CsatDraftStore, ttl: number, clockValue: clock.Clock): CsatDraftStore {
  return new CachedCsatDraftStore(inner, cache.newTtlCache<CsatDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects csat drafts. Empty fields match all. */
export class CsatDraftQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatDraft[]): CsatDraft[] {
    const matched = collections.filter(items, (candidate: CsatDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatDrafts(store: CsatDraftStore, query: CsatDraftQuery): CsatDraft[] {
  return query.apply(store.list());
}
