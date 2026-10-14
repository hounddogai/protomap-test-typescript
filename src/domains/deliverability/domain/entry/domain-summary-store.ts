import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DomainSummary } from "./domain-summary.js";

/** Keeps domain summaries by code. */
export interface DomainSummaryStore {
  find(code: string): DomainSummary | undefined;
  save(item: DomainSummary): void;
  remove(code: string): boolean;
  list(): DomainSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDomainSummaryStore implements DomainSummaryStore {
  items: Map<string, DomainSummary>;
  order: string[];

  constructor(items: Map<string, DomainSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DomainSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DomainSummary): void {
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

  list(): DomainSummary[] {
    const out: DomainSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDomainSummaryStore(): DomainSummaryStore {
  return new MemoryDomainSummaryStore(new Map<string, DomainSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDomainSummaryStore implements DomainSummaryStore {
  inner: DomainSummaryStore;
  cache: cache.TtlCache<DomainSummary>;
  hits: number;
  misses: number;

  constructor(inner: DomainSummaryStore, cacheValue: cache.TtlCache<DomainSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DomainSummary | undefined {
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

  save(item: DomainSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DomainSummary[] {
    return this.inner.list();
  }
}

export function newCachedDomainSummaryStore(inner: DomainSummaryStore, ttl: number, clockValue: clock.Clock): DomainSummaryStore {
  return new CachedDomainSummaryStore(inner, cache.newTtlCache<DomainSummary>(512, ttl, clockValue), 0, 0);
}

/** Selects domain summaries. Empty fields match all. */
export class DomainSummaryQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DomainSummary): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DomainSummary[]): DomainSummary[] {
    const matched = collections.filter(items, (candidate: DomainSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDomainSummaries(store: DomainSummaryStore, query: DomainSummaryQuery): DomainSummary[] {
  return query.apply(store.list());
}
