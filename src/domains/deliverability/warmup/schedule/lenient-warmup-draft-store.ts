import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWarmupDraft } from "./lenient-warmup-draft.js";

/** Keeps lenient warmup drafts by code. */
export interface LenientWarmupDraftStore {
  find(code: string): LenientWarmupDraft | undefined;
  save(item: LenientWarmupDraft): void;
  remove(code: string): boolean;
  list(): LenientWarmupDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWarmupDraftStore implements LenientWarmupDraftStore {
  items: Map<string, LenientWarmupDraft>;
  order: string[];

  constructor(items: Map<string, LenientWarmupDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWarmupDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWarmupDraft): void {
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

  list(): LenientWarmupDraft[] {
    const out: LenientWarmupDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWarmupDraftStore(): LenientWarmupDraftStore {
  return new MemoryLenientWarmupDraftStore(new Map<string, LenientWarmupDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWarmupDraftStore implements LenientWarmupDraftStore {
  inner: LenientWarmupDraftStore;
  cache: cache.TtlCache<LenientWarmupDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWarmupDraftStore,
    cacheValue: cache.TtlCache<LenientWarmupDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWarmupDraft | undefined {
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

  save(item: LenientWarmupDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWarmupDraft[] {
    return this.inner.list();
  }
}

export function newCachedLenientWarmupDraftStore(inner: LenientWarmupDraftStore, ttl: number, clockValue: clock.Clock): LenientWarmupDraftStore {
  return new CachedLenientWarmupDraftStore(inner, cache.newTtlCache<LenientWarmupDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects lenient warmup drafts. Empty fields match all. */
export class LenientWarmupDraftQuery {
  utmSource: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minRetries: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientWarmupDraft): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWarmupDraft[]): LenientWarmupDraft[] {
    const matched = collections.filter(items, (candidate: LenientWarmupDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWarmupDrafts(store: LenientWarmupDraftStore, query: LenientWarmupDraftQuery): LenientWarmupDraft[] {
  return query.apply(store.list());
}
