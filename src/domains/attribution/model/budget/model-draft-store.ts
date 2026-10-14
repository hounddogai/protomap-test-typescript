import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelDraft } from "./model-draft.js";

/** Keeps model drafts by code. */
export interface ModelDraftStore {
  find(code: string): ModelDraft | undefined;
  save(item: ModelDraft): void;
  remove(code: string): boolean;
  list(): ModelDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelDraftStore implements ModelDraftStore {
  items: Map<string, ModelDraft>;
  order: string[];

  constructor(items: Map<string, ModelDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelDraft): void {
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

  list(): ModelDraft[] {
    const out: ModelDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelDraftStore(): ModelDraftStore {
  return new MemoryModelDraftStore(new Map<string, ModelDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelDraftStore implements ModelDraftStore {
  inner: ModelDraftStore;
  cache: cache.TtlCache<ModelDraft>;
  hits: number;
  misses: number;

  constructor(inner: ModelDraftStore, cacheValue: cache.TtlCache<ModelDraft>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelDraft | undefined {
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

  save(item: ModelDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelDraft[] {
    return this.inner.list();
  }
}

export function newCachedModelDraftStore(inner: ModelDraftStore, ttl: number, clockValue: clock.Clock): ModelDraftStore {
  return new CachedModelDraftStore(inner, cache.newTtlCache<ModelDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects model drafts. Empty fields match all. */
export class ModelDraftQuery {
  region: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minMargin: number, statuses: string[], limit: number) {
    this.region = region;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelDraft): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelDraft[]): ModelDraft[] {
    const matched = collections.filter(items, (candidate: ModelDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelDrafts(store: ModelDraftStore, query: ModelDraftQuery): ModelDraft[] {
  return query.apply(store.list());
}
