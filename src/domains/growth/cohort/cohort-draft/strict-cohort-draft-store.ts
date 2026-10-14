import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictCohortDraft } from "./strict-cohort-draft.js";

/** Keeps strict cohort drafts by code. */
export interface StrictCohortDraftStore {
  find(code: string): StrictCohortDraft | undefined;
  save(item: StrictCohortDraft): void;
  remove(code: string): boolean;
  list(): StrictCohortDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictCohortDraftStore implements StrictCohortDraftStore {
  items: Map<string, StrictCohortDraft>;
  order: string[];

  constructor(items: Map<string, StrictCohortDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictCohortDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictCohortDraft): void {
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

  list(): StrictCohortDraft[] {
    const out: StrictCohortDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictCohortDraftStore(): StrictCohortDraftStore {
  return new MemoryStrictCohortDraftStore(new Map<string, StrictCohortDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictCohortDraftStore implements StrictCohortDraftStore {
  inner: StrictCohortDraftStore;
  cache: cache.TtlCache<StrictCohortDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictCohortDraftStore,
    cacheValue: cache.TtlCache<StrictCohortDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictCohortDraft | undefined {
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

  save(item: StrictCohortDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictCohortDraft[] {
    return this.inner.list();
  }
}

export function newCachedStrictCohortDraftStore(inner: StrictCohortDraftStore, ttl: number, clockValue: clock.Clock): StrictCohortDraftStore {
  return new CachedStrictCohortDraftStore(inner, cache.newTtlCache<StrictCohortDraft>(256, ttl, clockValue), 0, 0);
}

/** Selects strict cohort drafts. Empty fields match all. */
export class StrictCohortDraftQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictCohortDraft): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictCohortDraft[]): StrictCohortDraft[] {
    const matched = collections.filter(items, (candidate: StrictCohortDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictCohortDrafts(store: StrictCohortDraftStore, query: StrictCohortDraftQuery): StrictCohortDraft[] {
  return query.apply(store.list());
}
