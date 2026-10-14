import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CreativeSummary } from "./creative-summary.js";

/** Keeps creative summaries by code. */
export interface CreativeSummaryStore {
  find(code: string): CreativeSummary | undefined;
  save(item: CreativeSummary): void;
  remove(code: string): boolean;
  list(): CreativeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCreativeSummaryStore implements CreativeSummaryStore {
  items: Map<string, CreativeSummary>;
  order: string[];

  constructor(items: Map<string, CreativeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CreativeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CreativeSummary): void {
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

  list(): CreativeSummary[] {
    const out: CreativeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCreativeSummaryStore(): CreativeSummaryStore {
  return new MemoryCreativeSummaryStore(new Map<string, CreativeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCreativeSummaryStore implements CreativeSummaryStore {
  inner: CreativeSummaryStore;
  cache: cache.TtlCache<CreativeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: CreativeSummaryStore,
    cacheValue: cache.TtlCache<CreativeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CreativeSummary | undefined {
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

  save(item: CreativeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CreativeSummary[] {
    return this.inner.list();
  }
}

export function newCachedCreativeSummaryStore(inner: CreativeSummaryStore, ttl: number, clockValue: clock.Clock): CreativeSummaryStore {
  return new CachedCreativeSummaryStore(inner, cache.newTtlCache<CreativeSummary>(1024, ttl, clockValue), 0, 0);
}

/** Selects creative summaries. Empty fields match all. */
export class CreativeSummaryQuery {
  locale: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRetries: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CreativeSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CreativeSummary[]): CreativeSummary[] {
    const matched = collections.filter(items, (candidate: CreativeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCreativeSummaries(store: CreativeSummaryStore, query: CreativeSummaryQuery): CreativeSummary[] {
  return query.apply(store.list());
}
