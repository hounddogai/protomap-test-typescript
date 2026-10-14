import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalStepDraft } from "./seasonal-step-draft.js";

/** Keeps seasonal step drafts by code. */
export interface SeasonalStepDraftStore {
  find(code: string): SeasonalStepDraft | undefined;
  save(item: SeasonalStepDraft): void;
  remove(code: string): boolean;
  list(): SeasonalStepDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalStepDraftStore implements SeasonalStepDraftStore {
  items: Map<string, SeasonalStepDraft>;
  order: string[];

  constructor(items: Map<string, SeasonalStepDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalStepDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalStepDraft): void {
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

  list(): SeasonalStepDraft[] {
    const out: SeasonalStepDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalStepDraftStore(): SeasonalStepDraftStore {
  return new MemorySeasonalStepDraftStore(new Map<string, SeasonalStepDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalStepDraftStore implements SeasonalStepDraftStore {
  inner: SeasonalStepDraftStore;
  cache: cache.TtlCache<SeasonalStepDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalStepDraftStore,
    cacheValue: cache.TtlCache<SeasonalStepDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalStepDraft | undefined {
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

  save(item: SeasonalStepDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalStepDraft[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalStepDraftStore(inner: SeasonalStepDraftStore, ttl: number, clockValue: clock.Clock): SeasonalStepDraftStore {
  return new CachedSeasonalStepDraftStore(inner, cache.newTtlCache<SeasonalStepDraft>(512, ttl, clockValue), 0, 0);
}

/** Selects seasonal step drafts. Empty fields match all. */
export class SeasonalStepDraftQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalStepDraft): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalStepDraft[]): SeasonalStepDraft[] {
    const matched = collections.filter(items, (candidate: SeasonalStepDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalStepDrafts(store: SeasonalStepDraftStore, query: SeasonalStepDraftQuery): SeasonalStepDraft[] {
  return query.apply(store.list());
}
