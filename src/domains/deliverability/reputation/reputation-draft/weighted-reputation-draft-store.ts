import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedReputationDraft } from "./weighted-reputation-draft.js";

/** Keeps weighted reputation drafts by code. */
export interface WeightedReputationDraftStore {
  find(code: string): WeightedReputationDraft | undefined;
  save(item: WeightedReputationDraft): void;
  remove(code: string): boolean;
  list(): WeightedReputationDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedReputationDraftStore implements WeightedReputationDraftStore {
  items: Map<string, WeightedReputationDraft>;
  order: string[];

  constructor(items: Map<string, WeightedReputationDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedReputationDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedReputationDraft): void {
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

  list(): WeightedReputationDraft[] {
    const out: WeightedReputationDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedReputationDraftStore(): WeightedReputationDraftStore {
  return new MemoryWeightedReputationDraftStore(new Map<string, WeightedReputationDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedReputationDraftStore implements WeightedReputationDraftStore {
  inner: WeightedReputationDraftStore;
  cache: cache.TtlCache<WeightedReputationDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedReputationDraftStore,
    cacheValue: cache.TtlCache<WeightedReputationDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedReputationDraft | undefined {
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

  save(item: WeightedReputationDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedReputationDraft[] {
    return this.inner.list();
  }
}

export function newCachedWeightedReputationDraftStore(inner: WeightedReputationDraftStore, ttl: number, clockValue: clock.Clock): WeightedReputationDraftStore {
  return new CachedWeightedReputationDraftStore(
    inner,
    cache.newTtlCache<WeightedReputationDraft>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted reputation drafts. Empty fields match all. */
export class WeightedReputationDraftQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedReputationDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedReputationDraft[]): WeightedReputationDraft[] {
    const matched = collections.filter(items, (candidate: WeightedReputationDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedReputationDrafts(store: WeightedReputationDraftStore, query: WeightedReputationDraftQuery): WeightedReputationDraft[] {
  return query.apply(store.list());
}
