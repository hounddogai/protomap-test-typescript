import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledJourneyDraft } from "./scheduled-journey-draft.js";

/** Keeps scheduled journey drafts by code. */
export interface ScheduledJourneyDraftStore {
  find(code: string): ScheduledJourneyDraft | undefined;
  save(item: ScheduledJourneyDraft): void;
  remove(code: string): boolean;
  list(): ScheduledJourneyDraft[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledJourneyDraftStore implements ScheduledJourneyDraftStore {
  items: Map<string, ScheduledJourneyDraft>;
  order: string[];

  constructor(items: Map<string, ScheduledJourneyDraft>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledJourneyDraft | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledJourneyDraft): void {
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

  list(): ScheduledJourneyDraft[] {
    const out: ScheduledJourneyDraft[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledJourneyDraftStore(): ScheduledJourneyDraftStore {
  return new MemoryScheduledJourneyDraftStore(new Map<string, ScheduledJourneyDraft>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledJourneyDraftStore implements ScheduledJourneyDraftStore {
  inner: ScheduledJourneyDraftStore;
  cache: cache.TtlCache<ScheduledJourneyDraft>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledJourneyDraftStore,
    cacheValue: cache.TtlCache<ScheduledJourneyDraft>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledJourneyDraft | undefined {
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

  save(item: ScheduledJourneyDraft): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledJourneyDraft[] {
    return this.inner.list();
  }
}

export function newCachedScheduledJourneyDraftStore(inner: ScheduledJourneyDraftStore, ttl: number, clockValue: clock.Clock): ScheduledJourneyDraftStore {
  return new CachedScheduledJourneyDraftStore(
    inner,
    cache.newTtlCache<ScheduledJourneyDraft>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled journey drafts. Empty fields match all. */
export class ScheduledJourneyDraftQuery {
  region: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minConversionRate: number, statuses: string[], limit: number) {
    this.region = region;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledJourneyDraft): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledJourneyDraft[]): ScheduledJourneyDraft[] {
    const matched = collections.filter(items, (candidate: ScheduledJourneyDraft): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledJourneyDrafts(store: ScheduledJourneyDraftStore, query: ScheduledJourneyDraftQuery): ScheduledJourneyDraft[] {
  return query.apply(store.list());
}
