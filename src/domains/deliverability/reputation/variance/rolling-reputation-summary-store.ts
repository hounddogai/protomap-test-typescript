import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingReputationSummary } from "./rolling-reputation-summary.js";

/** Keeps rolling reputation summaries by code. */
export interface RollingReputationSummaryStore {
  find(code: string): RollingReputationSummary | undefined;
  save(item: RollingReputationSummary): void;
  remove(code: string): boolean;
  list(): RollingReputationSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingReputationSummaryStore implements RollingReputationSummaryStore {
  items: Map<string, RollingReputationSummary>;
  order: string[];

  constructor(items: Map<string, RollingReputationSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingReputationSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingReputationSummary): void {
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

  list(): RollingReputationSummary[] {
    const out: RollingReputationSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingReputationSummaryStore(): RollingReputationSummaryStore {
  return new MemoryRollingReputationSummaryStore(new Map<string, RollingReputationSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingReputationSummaryStore implements RollingReputationSummaryStore {
  inner: RollingReputationSummaryStore;
  cache: cache.TtlCache<RollingReputationSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingReputationSummaryStore,
    cacheValue: cache.TtlCache<RollingReputationSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingReputationSummary | undefined {
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

  save(item: RollingReputationSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingReputationSummary[] {
    return this.inner.list();
  }
}

export function newCachedRollingReputationSummaryStore(inner: RollingReputationSummaryStore, ttl: number, clockValue: clock.Clock): RollingReputationSummaryStore {
  return new CachedRollingReputationSummaryStore(
    inner,
    cache.newTtlCache<RollingReputationSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling reputation summaries. Empty fields match all. */
export class RollingReputationSummaryQuery {
  locale: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minSequence: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingReputationSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingReputationSummary[]): RollingReputationSummary[] {
    const matched = collections.filter(items, (candidate: RollingReputationSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingReputationSummaries(store: RollingReputationSummaryStore, query: RollingReputationSummaryQuery): RollingReputationSummary[] {
  return query.apply(store.list());
}
