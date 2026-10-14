import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { JourneySummary } from "./journey-summary.js";

/** Keeps journey summaries by code. */
export interface JourneySummaryStore {
  find(code: string): JourneySummary | undefined;
  save(item: JourneySummary): void;
  remove(code: string): boolean;
  list(): JourneySummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryJourneySummaryStore implements JourneySummaryStore {
  items: Map<string, JourneySummary>;
  order: string[];

  constructor(items: Map<string, JourneySummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): JourneySummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: JourneySummary): void {
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

  list(): JourneySummary[] {
    const out: JourneySummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryJourneySummaryStore(): JourneySummaryStore {
  return new MemoryJourneySummaryStore(new Map<string, JourneySummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedJourneySummaryStore implements JourneySummaryStore {
  inner: JourneySummaryStore;
  cache: cache.TtlCache<JourneySummary>;
  hits: number;
  misses: number;

  constructor(
    inner: JourneySummaryStore,
    cacheValue: cache.TtlCache<JourneySummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): JourneySummary | undefined {
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

  save(item: JourneySummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): JourneySummary[] {
    return this.inner.list();
  }
}

export function newCachedJourneySummaryStore(inner: JourneySummaryStore, ttl: number, clockValue: clock.Clock): JourneySummaryStore {
  return new CachedJourneySummaryStore(inner, cache.newTtlCache<JourneySummary>(512, ttl, clockValue), 0, 0);
}

/** Selects journey summaries. Empty fields match all. */
export class JourneySummaryQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: JourneySummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: JourneySummary[]): JourneySummary[] {
    const matched = collections.filter(items, (candidate: JourneySummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findJourneySummaries(store: JourneySummaryStore, query: JourneySummaryQuery): JourneySummary[] {
  return query.apply(store.list());
}
