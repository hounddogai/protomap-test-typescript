import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultStreakSummary } from "./default-streak-summary.js";

/** Keeps default streak summaries by code. */
export interface DefaultStreakSummaryStore {
  find(code: string): DefaultStreakSummary | undefined;
  save(item: DefaultStreakSummary): void;
  remove(code: string): boolean;
  list(): DefaultStreakSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultStreakSummaryStore implements DefaultStreakSummaryStore {
  items: Map<string, DefaultStreakSummary>;
  order: string[];

  constructor(items: Map<string, DefaultStreakSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultStreakSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultStreakSummary): void {
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

  list(): DefaultStreakSummary[] {
    const out: DefaultStreakSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultStreakSummaryStore(): DefaultStreakSummaryStore {
  return new MemoryDefaultStreakSummaryStore(new Map<string, DefaultStreakSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultStreakSummaryStore implements DefaultStreakSummaryStore {
  inner: DefaultStreakSummaryStore;
  cache: cache.TtlCache<DefaultStreakSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultStreakSummaryStore,
    cacheValue: cache.TtlCache<DefaultStreakSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultStreakSummary | undefined {
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

  save(item: DefaultStreakSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultStreakSummary[] {
    return this.inner.list();
  }
}

export function newCachedDefaultStreakSummaryStore(inner: DefaultStreakSummaryStore, ttl: number, clockValue: clock.Clock): DefaultStreakSummaryStore {
  return new CachedDefaultStreakSummaryStore(
    inner,
    cache.newTtlCache<DefaultStreakSummary>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default streak summaries. Empty fields match all. */
export class DefaultStreakSummaryQuery {
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

  matches(item: DefaultStreakSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultStreakSummary[]): DefaultStreakSummary[] {
    const matched = collections.filter(items, (candidate: DefaultStreakSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultStreakSummaries(store: DefaultStreakSummaryStore, query: DefaultStreakSummaryQuery): DefaultStreakSummary[] {
  return query.apply(store.list());
}
