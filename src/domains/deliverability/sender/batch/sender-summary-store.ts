import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SenderSummary } from "./sender-summary.js";

/** Keeps sender summaries by code. */
export interface SenderSummaryStore {
  find(code: string): SenderSummary | undefined;
  save(item: SenderSummary): void;
  remove(code: string): boolean;
  list(): SenderSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySenderSummaryStore implements SenderSummaryStore {
  items: Map<string, SenderSummary>;
  order: string[];

  constructor(items: Map<string, SenderSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SenderSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SenderSummary): void {
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

  list(): SenderSummary[] {
    const out: SenderSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySenderSummaryStore(): SenderSummaryStore {
  return new MemorySenderSummaryStore(new Map<string, SenderSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSenderSummaryStore implements SenderSummaryStore {
  inner: SenderSummaryStore;
  cache: cache.TtlCache<SenderSummary>;
  hits: number;
  misses: number;

  constructor(inner: SenderSummaryStore, cacheValue: cache.TtlCache<SenderSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SenderSummary | undefined {
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

  save(item: SenderSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SenderSummary[] {
    return this.inner.list();
  }
}

export function newCachedSenderSummaryStore(inner: SenderSummaryStore, ttl: number, clockValue: clock.Clock): SenderSummaryStore {
  return new CachedSenderSummaryStore(inner, cache.newTtlCache<SenderSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects sender summaries. Empty fields match all. */
export class SenderSummaryQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SenderSummary): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SenderSummary[]): SenderSummary[] {
    const matched = collections.filter(items, (candidate: SenderSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSenderSummaries(store: SenderSummaryStore, query: SenderSummaryQuery): SenderSummary[] {
  return query.apply(store.list());
}
