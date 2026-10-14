import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackInsightDraft } from "./fallback-insight-draft.js";

/** Keeps fallback insight drafts by code. */
export interface FallbackInsightDraftStore {
  find(code: string): FallbackInsightDraft | undefined;
  save(item: FallbackInsightDraft): void;
  remove(code: string): boolean;
  list(): FallbackInsightDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackInsightDraftStore implements FallbackInsightDraftStore {
  items: Map<string, FallbackInsightDraft>;
  order: string[];

  constructor(items: Map<string, FallbackInsightDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackInsightDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackInsightDraft): void {
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

  list(): FallbackInsightDraft[] {
    const out: FallbackInsightDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackInsightDraftStore(): FallbackInsightDraftStore {
  return new MemoryFallbackInsightDraftStore(new Map<string, FallbackInsightDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackInsightDraftStore implements FallbackInsightDraftStore {
  inner: FallbackInsightDraftStore;
  cache: cache.TtlCache<FallbackInsightDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackInsightDraftStore,
    cacheValue: cache.TtlCache<FallbackInsightDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackInsightDraft | undefined {
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

  save(item: FallbackInsightDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackInsightDraft[] {
    return this.inner.list();
  }
}

export function newCachedFallbackInsightDraftStore(inner: FallbackInsightDraftStore, ttl: number, clockValue: clock.Clock): FallbackInsightDraftStore {
  return new CachedFallbackInsightDraftStore(
    inner,
    cache.newTtlCache<FallbackInsightDraft>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback insight drafts. Empty fields match all. */
export class FallbackInsightDraftQuery {
  label: string;
  minSendAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minSendAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minSendAt = minSendAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackInsightDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.sendAt < this.minSendAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackInsightDraft[]): FallbackInsightDraft[] {
    const matched = collections.filter(items, (candidate: FallbackInsightDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackInsightDrafts(store: FallbackInsightDraftStore, query: FallbackInsightDraftQuery): FallbackInsightDraft[] {
  return query.apply(store.list());
}
