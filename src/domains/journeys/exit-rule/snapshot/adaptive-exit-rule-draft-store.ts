import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

/** Keeps adaptive exit rule drafts by code. */
export interface AdaptiveExitRuleDraftStore {
  find(code: string): AdaptiveExitRuleDraft | undefined;
  save(item: AdaptiveExitRuleDraft): void;
  remove(code: string): boolean;
  list(): AdaptiveExitRuleDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveExitRuleDraftStore implements AdaptiveExitRuleDraftStore {
  items: Map<string, AdaptiveExitRuleDraft>;
  order: string[];

  constructor(items: Map<string, AdaptiveExitRuleDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveExitRuleDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveExitRuleDraft): void {
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

  list(): AdaptiveExitRuleDraft[] {
    const out: AdaptiveExitRuleDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveExitRuleDraftStore(): AdaptiveExitRuleDraftStore {
  return new MemoryAdaptiveExitRuleDraftStore(new Map<string, AdaptiveExitRuleDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveExitRuleDraftStore implements AdaptiveExitRuleDraftStore {
  inner: AdaptiveExitRuleDraftStore;
  cache: cache.TtlCache<AdaptiveExitRuleDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveExitRuleDraftStore,
    cacheValue: cache.TtlCache<AdaptiveExitRuleDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveExitRuleDraft | undefined {
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

  save(item: AdaptiveExitRuleDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveExitRuleDraft[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveExitRuleDraftStore(inner: AdaptiveExitRuleDraftStore, ttl: number, clockValue: clock.Clock): AdaptiveExitRuleDraftStore {
  return new CachedAdaptiveExitRuleDraftStore(
    inner,
    cache.newTtlCache<AdaptiveExitRuleDraft>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive exit rule drafts. Empty fields match all. */
export class AdaptiveExitRuleDraftQuery {
  locale: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveExitRuleDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveExitRuleDraft[]): AdaptiveExitRuleDraft[] {
    const matched = collections.filter(items, (candidate: AdaptiveExitRuleDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveExitRuleDrafts(store: AdaptiveExitRuleDraftStore, query: AdaptiveExitRuleDraftQuery): AdaptiveExitRuleDraft[] {
  return query.apply(store.list());
}
