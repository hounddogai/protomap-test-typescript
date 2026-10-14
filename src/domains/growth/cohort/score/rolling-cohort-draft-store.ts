import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingCohortDraft } from "./rolling-cohort-draft.js";

/** Keeps rolling cohort drafts by code. */
export interface RollingCohortDraftStore {
  find(code: string): RollingCohortDraft | undefined;
  save(item: RollingCohortDraft): void;
  remove(code: string): boolean;
  list(): RollingCohortDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingCohortDraftStore implements RollingCohortDraftStore {
  items: Map<string, RollingCohortDraft>;
  order: string[];

  constructor(items: Map<string, RollingCohortDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingCohortDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingCohortDraft): void {
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

  list(): RollingCohortDraft[] {
    const out: RollingCohortDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingCohortDraftStore(): RollingCohortDraftStore {
  return new MemoryRollingCohortDraftStore(new Map<string, RollingCohortDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingCohortDraftStore implements RollingCohortDraftStore {
  inner: RollingCohortDraftStore;
  cache: cache.TtlCache<RollingCohortDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingCohortDraftStore,
    cacheValue: cache.TtlCache<RollingCohortDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingCohortDraft | undefined {
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

  save(item: RollingCohortDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingCohortDraft[] {
    return this.inner.list();
  }
}

export function newCachedRollingCohortDraftStore(inner: RollingCohortDraftStore, ttl: number, clockValue: clock.Clock): RollingCohortDraftStore {
  return new CachedRollingCohortDraftStore(inner, cache.newTtlCache<RollingCohortDraft>(64, ttl, clockValue), 0, 0);
}

/** Selects rolling cohort drafts. Empty fields match all. */
export class RollingCohortDraftQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingCohortDraft): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingCohortDraft[]): RollingCohortDraft[] {
    const matched = collections.filter(items, (candidate: RollingCohortDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingCohortDrafts(store: RollingCohortDraftStore, query: RollingCohortDraftQuery): RollingCohortDraft[] {
  return query.apply(store.list());
}
