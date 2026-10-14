import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionDraft } from "./retention-draft.js";

/** Keeps retention drafts by code. */
export interface RetentionDraftStore {
  find(code: string): RetentionDraft | undefined;
  save(item: RetentionDraft): void;
  remove(code: string): boolean;
  list(): RetentionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionDraftStore implements RetentionDraftStore {
  items: Map<string, RetentionDraft>;
  order: string[];

  constructor(items: Map<string, RetentionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionDraft): void {
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

  list(): RetentionDraft[] {
    const out: RetentionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionDraftStore(): RetentionDraftStore {
  return new MemoryRetentionDraftStore(new Map<string, RetentionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionDraftStore implements RetentionDraftStore {
  inner: RetentionDraftStore;
  cache: cache.TtlCache<RetentionDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionDraftStore,
    cacheValue: cache.TtlCache<RetentionDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionDraft | undefined {
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

  save(item: RetentionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionDraft[] {
    return this.inner.list();
  }
}

export function newCachedRetentionDraftStore(inner: RetentionDraftStore, ttl: number, clockValue: clock.Clock): RetentionDraftStore {
  return new CachedRetentionDraftStore(inner, cache.newTtlCache<RetentionDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects retention drafts. Empty fields match all. */
export class RetentionDraftQuery {
  category: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minClicks: number, statuses: string[], limit: number) {
    this.category = category;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionDraft): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionDraft[]): RetentionDraft[] {
    const matched = collections.filter(items, (candidate: RetentionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionDrafts(store: RetentionDraftStore, query: RetentionDraftQuery): RetentionDraft[] {
  return query.apply(store.list());
}
