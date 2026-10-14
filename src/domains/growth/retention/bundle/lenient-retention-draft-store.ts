import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientRetentionDraft } from "./lenient-retention-draft.js";

/** Keeps lenient retention drafts by code. */
export interface LenientRetentionDraftStore {
  find(code: string): LenientRetentionDraft | undefined;
  save(item: LenientRetentionDraft): void;
  remove(code: string): boolean;
  list(): LenientRetentionDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientRetentionDraftStore implements LenientRetentionDraftStore {
  items: Map<string, LenientRetentionDraft>;
  order: string[];

  constructor(items: Map<string, LenientRetentionDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientRetentionDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientRetentionDraft): void {
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

  list(): LenientRetentionDraft[] {
    const out: LenientRetentionDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientRetentionDraftStore(): LenientRetentionDraftStore {
  return new MemoryLenientRetentionDraftStore(new Map<string, LenientRetentionDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientRetentionDraftStore implements LenientRetentionDraftStore {
  inner: LenientRetentionDraftStore;
  cache: cache.TtlCache<LenientRetentionDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientRetentionDraftStore,
    cacheValue: cache.TtlCache<LenientRetentionDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientRetentionDraft | undefined {
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

  save(item: LenientRetentionDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientRetentionDraft[] {
    return this.inner.list();
  }
}

export function newCachedLenientRetentionDraftStore(inner: LenientRetentionDraftStore, ttl: number, clockValue: clock.Clock): LenientRetentionDraftStore {
  return new CachedLenientRetentionDraftStore(
    inner,
    cache.newTtlCache<LenientRetentionDraft>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient retention drafts. Empty fields match all. */
export class LenientRetentionDraftQuery {
  segment: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientRetentionDraft): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientRetentionDraft[]): LenientRetentionDraft[] {
    const matched = collections.filter(items, (candidate: LenientRetentionDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientRetentionDrafts(store: LenientRetentionDraftStore, query: LenientRetentionDraftQuery): LenientRetentionDraft[] {
  return query.apply(store.list());
}
