import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveInviteSummary } from "./adaptive-invite-summary.js";

/** Keeps adaptive invite summaries by code. */
export interface AdaptiveInviteSummaryStore {
  find(code: string): AdaptiveInviteSummary | undefined;
  save(item: AdaptiveInviteSummary): void;
  remove(code: string): boolean;
  list(): AdaptiveInviteSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveInviteSummaryStore implements AdaptiveInviteSummaryStore {
  items: Map<string, AdaptiveInviteSummary>;
  order: string[];

  constructor(items: Map<string, AdaptiveInviteSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveInviteSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveInviteSummary): void {
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

  list(): AdaptiveInviteSummary[] {
    const out: AdaptiveInviteSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveInviteSummaryStore(): AdaptiveInviteSummaryStore {
  return new MemoryAdaptiveInviteSummaryStore(new Map<string, AdaptiveInviteSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveInviteSummaryStore implements AdaptiveInviteSummaryStore {
  inner: AdaptiveInviteSummaryStore;
  cache: cache.TtlCache<AdaptiveInviteSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveInviteSummaryStore,
    cacheValue: cache.TtlCache<AdaptiveInviteSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveInviteSummary | undefined {
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

  save(item: AdaptiveInviteSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveInviteSummary[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveInviteSummaryStore(inner: AdaptiveInviteSummaryStore, ttl: number, clockValue: clock.Clock): AdaptiveInviteSummaryStore {
  return new CachedAdaptiveInviteSummaryStore(
    inner,
    cache.newTtlCache<AdaptiveInviteSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive invite summaries. Empty fields match all. */
export class AdaptiveInviteSummaryQuery {
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

  matches(item: AdaptiveInviteSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveInviteSummary[]): AdaptiveInviteSummary[] {
    const matched = collections.filter(items, (candidate: AdaptiveInviteSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveInviteSummaries(store: AdaptiveInviteSummaryStore, query: AdaptiveInviteSummaryQuery): AdaptiveInviteSummary[] {
  return query.apply(store.list());
}
