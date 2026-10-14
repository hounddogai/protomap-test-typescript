import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ExitRuleSummary } from "./exit-rule-summary.js";

/** Keeps exit rule summaries by code. */
export interface ExitRuleSummaryStore {
  find(code: string): ExitRuleSummary | undefined;
  save(item: ExitRuleSummary): void;
  remove(code: string): boolean;
  list(): ExitRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryExitRuleSummaryStore implements ExitRuleSummaryStore {
  items: Map<string, ExitRuleSummary>;
  order: string[];

  constructor(items: Map<string, ExitRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ExitRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ExitRuleSummary): void {
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

  list(): ExitRuleSummary[] {
    const out: ExitRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryExitRuleSummaryStore(): ExitRuleSummaryStore {
  return new MemoryExitRuleSummaryStore(new Map<string, ExitRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedExitRuleSummaryStore implements ExitRuleSummaryStore {
  inner: ExitRuleSummaryStore;
  cache: cache.TtlCache<ExitRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: ExitRuleSummaryStore,
    cacheValue: cache.TtlCache<ExitRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ExitRuleSummary | undefined {
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

  save(item: ExitRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ExitRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedExitRuleSummaryStore(inner: ExitRuleSummaryStore, ttl: number, clockValue: clock.Clock): ExitRuleSummaryStore {
  return new CachedExitRuleSummaryStore(inner, cache.newTtlCache<ExitRuleSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects exit rule summaries. Empty fields match all. */
export class ExitRuleSummaryQuery {
  title: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.title = title;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ExitRuleSummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ExitRuleSummary[]): ExitRuleSummary[] {
    const matched = collections.filter(items, (candidate: ExitRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findExitRuleSummaries(store: ExitRuleSummaryStore, query: ExitRuleSummaryQuery): ExitRuleSummary[] {
  return query.apply(store.list());
}
