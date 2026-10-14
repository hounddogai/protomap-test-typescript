import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultWarmupSummary } from "./default-warmup-summary.js";

/** Keeps default warmup summaries by code. */
export interface DefaultWarmupSummaryStore {
  find(code: string): DefaultWarmupSummary | undefined;
  save(item: DefaultWarmupSummary): void;
  remove(code: string): boolean;
  list(): DefaultWarmupSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultWarmupSummaryStore implements DefaultWarmupSummaryStore {
  items: Map<string, DefaultWarmupSummary>;
  order: string[];

  constructor(items: Map<string, DefaultWarmupSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultWarmupSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultWarmupSummary): void {
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

  list(): DefaultWarmupSummary[] {
    const out: DefaultWarmupSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultWarmupSummaryStore(): DefaultWarmupSummaryStore {
  return new MemoryDefaultWarmupSummaryStore(new Map<string, DefaultWarmupSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultWarmupSummaryStore implements DefaultWarmupSummaryStore {
  inner: DefaultWarmupSummaryStore;
  cache: cache.TtlCache<DefaultWarmupSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultWarmupSummaryStore,
    cacheValue: cache.TtlCache<DefaultWarmupSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultWarmupSummary | undefined {
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

  save(item: DefaultWarmupSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultWarmupSummary[] {
    return this.inner.list();
  }
}

export function newCachedDefaultWarmupSummaryStore(inner: DefaultWarmupSummaryStore, ttl: number, clockValue: clock.Clock): DefaultWarmupSummaryStore {
  return new CachedDefaultWarmupSummaryStore(
    inner,
    cache.newTtlCache<DefaultWarmupSummary>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default warmup summaries. Empty fields match all. */
export class DefaultWarmupSummaryQuery {
  locale: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minEndsAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultWarmupSummary): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultWarmupSummary[]): DefaultWarmupSummary[] {
    const matched = collections.filter(items, (candidate: DefaultWarmupSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultWarmupSummaries(store: DefaultWarmupSummaryStore, query: DefaultWarmupSummaryQuery): DefaultWarmupSummary[] {
  return query.apply(store.list());
}
