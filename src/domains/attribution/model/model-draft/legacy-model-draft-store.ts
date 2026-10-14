import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyModelDraft } from "./legacy-model-draft.js";

/** Keeps legacy model drafts by code. */
export interface LegacyModelDraftStore {
  find(code: string): LegacyModelDraft | undefined;
  save(item: LegacyModelDraft): void;
  remove(code: string): boolean;
  list(): LegacyModelDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyModelDraftStore implements LegacyModelDraftStore {
  items: Map<string, LegacyModelDraft>;
  order: string[];

  constructor(items: Map<string, LegacyModelDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyModelDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyModelDraft): void {
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

  list(): LegacyModelDraft[] {
    const out: LegacyModelDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyModelDraftStore(): LegacyModelDraftStore {
  return new MemoryLegacyModelDraftStore(new Map<string, LegacyModelDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyModelDraftStore implements LegacyModelDraftStore {
  inner: LegacyModelDraftStore;
  cache: cache.TtlCache<LegacyModelDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyModelDraftStore,
    cacheValue: cache.TtlCache<LegacyModelDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyModelDraft | undefined {
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

  save(item: LegacyModelDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyModelDraft[] {
    return this.inner.list();
  }
}

export function newCachedLegacyModelDraftStore(inner: LegacyModelDraftStore, ttl: number, clockValue: clock.Clock): LegacyModelDraftStore {
  return new CachedLegacyModelDraftStore(inner, cache.newTtlCache<LegacyModelDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects legacy model drafts. Empty fields match all. */
export class LegacyModelDraftQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyModelDraft): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyModelDraft[]): LegacyModelDraft[] {
    const matched = collections.filter(items, (candidate: LegacyModelDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyModelDrafts(store: LegacyModelDraftStore, query: LegacyModelDraftQuery): LegacyModelDraft[] {
  return query.apply(store.list());
}
