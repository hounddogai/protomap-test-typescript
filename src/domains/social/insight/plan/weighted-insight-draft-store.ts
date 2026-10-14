import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedInsightDraft } from "./weighted-insight-draft.js";

/** Keeps weighted insight drafts by code. */
export interface WeightedInsightDraftStore {
  find(code: string): WeightedInsightDraft | undefined;
  save(item: WeightedInsightDraft): void;
  remove(code: string): boolean;
  list(): WeightedInsightDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedInsightDraftStore implements WeightedInsightDraftStore {
  items: Map<string, WeightedInsightDraft>;
  order: string[];

  constructor(items: Map<string, WeightedInsightDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedInsightDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedInsightDraft): void {
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

  list(): WeightedInsightDraft[] {
    const out: WeightedInsightDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedInsightDraftStore(): WeightedInsightDraftStore {
  return new MemoryWeightedInsightDraftStore(new Map<string, WeightedInsightDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedInsightDraftStore implements WeightedInsightDraftStore {
  inner: WeightedInsightDraftStore;
  cache: cache.TtlCache<WeightedInsightDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedInsightDraftStore,
    cacheValue: cache.TtlCache<WeightedInsightDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedInsightDraft | undefined {
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

  save(item: WeightedInsightDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedInsightDraft[] {
    return this.inner.list();
  }
}

export function newCachedWeightedInsightDraftStore(inner: WeightedInsightDraftStore, ttl: number, clockValue: clock.Clock): WeightedInsightDraftStore {
  return new CachedWeightedInsightDraftStore(inner, cache.newTtlCache<WeightedInsightDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects weighted insight drafts. Empty fields match all. */
export class WeightedInsightDraftQuery {
  locale: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minScore: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedInsightDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedInsightDraft[]): WeightedInsightDraft[] {
    const matched = collections.filter(items, (candidate: WeightedInsightDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedInsightDrafts(store: WeightedInsightDraftStore, query: WeightedInsightDraftQuery): WeightedInsightDraft[] {
  return query.apply(store.list());
}
