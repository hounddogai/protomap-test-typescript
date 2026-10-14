import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackCsatDraft } from "./fallback-csat-draft.js";

/** Keeps fallback csat drafts by code. */
export interface FallbackCsatDraftStore {
  find(code: string): FallbackCsatDraft | undefined;
  save(item: FallbackCsatDraft): void;
  remove(code: string): boolean;
  list(): FallbackCsatDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackCsatDraftStore implements FallbackCsatDraftStore {
  items: Map<string, FallbackCsatDraft>;
  order: string[];

  constructor(items: Map<string, FallbackCsatDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackCsatDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackCsatDraft): void {
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

  list(): FallbackCsatDraft[] {
    const out: FallbackCsatDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackCsatDraftStore(): FallbackCsatDraftStore {
  return new MemoryFallbackCsatDraftStore(new Map<string, FallbackCsatDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackCsatDraftStore implements FallbackCsatDraftStore {
  inner: FallbackCsatDraftStore;
  cache: cache.TtlCache<FallbackCsatDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackCsatDraftStore,
    cacheValue: cache.TtlCache<FallbackCsatDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackCsatDraft | undefined {
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

  save(item: FallbackCsatDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackCsatDraft[] {
    return this.inner.list();
  }
}

export function newCachedFallbackCsatDraftStore(inner: FallbackCsatDraftStore, ttl: number, clockValue: clock.Clock): FallbackCsatDraftStore {
  return new CachedFallbackCsatDraftStore(inner, cache.newTtlCache<FallbackCsatDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects fallback csat drafts. Empty fields match all. */
export class FallbackCsatDraftQuery {
  name: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minSendAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackCsatDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackCsatDraft[]): FallbackCsatDraft[] {
    const matched = collections.filter(items, (candidate: FallbackCsatDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackCsatDrafts(store: FallbackCsatDraftStore, query: FallbackCsatDraftQuery): FallbackCsatDraft[] {
  return query.apply(store.list());
}
