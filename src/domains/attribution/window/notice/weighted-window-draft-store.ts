import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWindowDraft } from "./weighted-window-draft.js";

/** Keeps weighted window drafts by code. */
export interface WeightedWindowDraftStore {
  find(code: string): WeightedWindowDraft | undefined;
  save(item: WeightedWindowDraft): void;
  remove(code: string): boolean;
  list(): WeightedWindowDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWindowDraftStore implements WeightedWindowDraftStore {
  items: Map<string, WeightedWindowDraft>;
  order: string[];

  constructor(items: Map<string, WeightedWindowDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWindowDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWindowDraft): void {
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

  list(): WeightedWindowDraft[] {
    const out: WeightedWindowDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWindowDraftStore(): WeightedWindowDraftStore {
  return new MemoryWeightedWindowDraftStore(new Map<string, WeightedWindowDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWindowDraftStore implements WeightedWindowDraftStore {
  inner: WeightedWindowDraftStore;
  cache: cache.TtlCache<WeightedWindowDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWindowDraftStore,
    cacheValue: cache.TtlCache<WeightedWindowDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWindowDraft | undefined {
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

  save(item: WeightedWindowDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWindowDraft[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWindowDraftStore(inner: WeightedWindowDraftStore, ttl: number, clockValue: clock.Clock): WeightedWindowDraftStore {
  return new CachedWeightedWindowDraftStore(inner, cache.newTtlCache<WeightedWindowDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects weighted window drafts. Empty fields match all. */
export class WeightedWindowDraftQuery {
  label: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minScore: number, statuses: string[], limit: number) {
    this.label = label;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWindowDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWindowDraft[]): WeightedWindowDraft[] {
    const matched = collections.filter(items, (candidate: WeightedWindowDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWindowDrafts(store: WeightedWindowDraftStore, query: WeightedWindowDraftQuery): WeightedWindowDraft[] {
  return query.apply(store.list());
}
