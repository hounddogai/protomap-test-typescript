import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPacingSummary } from "./default-pacing-summary.js";

/** Keeps default pacing summaries by code. */
export interface DefaultPacingSummaryStore {
  find(code: string): DefaultPacingSummary | undefined;
  save(item: DefaultPacingSummary): void;
  remove(code: string): boolean;
  list(): DefaultPacingSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPacingSummaryStore implements DefaultPacingSummaryStore {
  items: Map<string, DefaultPacingSummary>;
  order: string[];

  constructor(items: Map<string, DefaultPacingSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPacingSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPacingSummary): void {
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

  list(): DefaultPacingSummary[] {
    const out: DefaultPacingSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPacingSummaryStore(): DefaultPacingSummaryStore {
  return new MemoryDefaultPacingSummaryStore(new Map<string, DefaultPacingSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPacingSummaryStore implements DefaultPacingSummaryStore {
  inner: DefaultPacingSummaryStore;
  cache: cache.TtlCache<DefaultPacingSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPacingSummaryStore,
    cacheValue: cache.TtlCache<DefaultPacingSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPacingSummary | undefined {
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

  save(item: DefaultPacingSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPacingSummary[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPacingSummaryStore(inner: DefaultPacingSummaryStore, ttl: number, clockValue: clock.Clock): DefaultPacingSummaryStore {
  return new CachedDefaultPacingSummaryStore(
    inner,
    cache.newTtlCache<DefaultPacingSummary>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default pacing summaries. Empty fields match all. */
export class DefaultPacingSummaryQuery {
  label: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minRate: number, statuses: string[], limit: number) {
    this.label = label;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPacingSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPacingSummary[]): DefaultPacingSummary[] {
    const matched = collections.filter(items, (candidate: DefaultPacingSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPacingSummaries(store: DefaultPacingSummaryStore, query: DefaultPacingSummaryQuery): DefaultPacingSummary[] {
  return query.apply(store.list());
}
