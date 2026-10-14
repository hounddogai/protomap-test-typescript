import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PathSummary } from "./path-summary.js";

/** Keeps path summaries by code. */
export interface PathSummaryStore {
  find(code: string): PathSummary | undefined;
  save(item: PathSummary): void;
  remove(code: string): boolean;
  list(): PathSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPathSummaryStore implements PathSummaryStore {
  items: Map<string, PathSummary>;
  order: string[];

  constructor(items: Map<string, PathSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PathSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PathSummary): void {
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

  list(): PathSummary[] {
    const out: PathSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPathSummaryStore(): PathSummaryStore {
  return new MemoryPathSummaryStore(new Map<string, PathSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPathSummaryStore implements PathSummaryStore {
  inner: PathSummaryStore;
  cache: cache.TtlCache<PathSummary>;
  hits: number;
  misses: number;

  constructor(inner: PathSummaryStore, cacheValue: cache.TtlCache<PathSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PathSummary | undefined {
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

  save(item: PathSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PathSummary[] {
    return this.inner.list();
  }
}

export function newCachedPathSummaryStore(inner: PathSummaryStore, ttl: number, clockValue: clock.Clock): PathSummaryStore {
  return new CachedPathSummaryStore(inner, cache.newTtlCache<PathSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects path summaries. Empty fields match all. */
export class PathSummaryQuery {
  label: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minWeight: number, statuses: string[], limit: number) {
    this.label = label;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PathSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PathSummary[]): PathSummary[] {
    const matched = collections.filter(items, (candidate: PathSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPathSummaries(store: PathSummaryStore, query: PathSummaryQuery): PathSummary[] {
  return query.apply(store.list());
}
