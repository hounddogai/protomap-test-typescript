import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictPlacementDraft } from "./strict-placement-draft.js";

/** Keeps strict placement drafts by code. */
export interface StrictPlacementDraftStore {
  find(code: string): StrictPlacementDraft | undefined;
  save(item: StrictPlacementDraft): void;
  remove(code: string): boolean;
  list(): StrictPlacementDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictPlacementDraftStore implements StrictPlacementDraftStore {
  items: Map<string, StrictPlacementDraft>;
  order: string[];

  constructor(items: Map<string, StrictPlacementDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictPlacementDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictPlacementDraft): void {
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

  list(): StrictPlacementDraft[] {
    const out: StrictPlacementDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictPlacementDraftStore(): StrictPlacementDraftStore {
  return new MemoryStrictPlacementDraftStore(new Map<string, StrictPlacementDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictPlacementDraftStore implements StrictPlacementDraftStore {
  inner: StrictPlacementDraftStore;
  cache: cache.TtlCache<StrictPlacementDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictPlacementDraftStore,
    cacheValue: cache.TtlCache<StrictPlacementDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictPlacementDraft | undefined {
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

  save(item: StrictPlacementDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictPlacementDraft[] {
    return this.inner.list();
  }
}

export function newCachedStrictPlacementDraftStore(inner: StrictPlacementDraftStore, ttl: number, clockValue: clock.Clock): StrictPlacementDraftStore {
  return new CachedStrictPlacementDraftStore(
    inner,
    cache.newTtlCache<StrictPlacementDraft>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict placement drafts. Empty fields match all. */
export class StrictPlacementDraftQuery {
  locale: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minQuantity: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictPlacementDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictPlacementDraft[]): StrictPlacementDraft[] {
    const matched = collections.filter(items, (candidate: StrictPlacementDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictPlacementDrafts(store: StrictPlacementDraftStore, query: StrictPlacementDraftQuery): StrictPlacementDraft[] {
  return query.apply(store.list());
}
