import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WindowSummary } from "./window-summary.js";

/** Keeps window summaries by code. */
export interface WindowSummaryStore {
  find(code: string): WindowSummary | undefined;
  save(item: WindowSummary): void;
  remove(code: string): boolean;
  list(): WindowSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWindowSummaryStore implements WindowSummaryStore {
  items: Map<string, WindowSummary>;
  order: string[];

  constructor(items: Map<string, WindowSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WindowSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WindowSummary): void {
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

  list(): WindowSummary[] {
    const out: WindowSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWindowSummaryStore(): WindowSummaryStore {
  return new MemoryWindowSummaryStore(new Map<string, WindowSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWindowSummaryStore implements WindowSummaryStore {
  inner: WindowSummaryStore;
  cache: cache.TtlCache<WindowSummary>;
  hits: number;
  misses: number;

  constructor(inner: WindowSummaryStore, cacheValue: cache.TtlCache<WindowSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WindowSummary | undefined {
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

  save(item: WindowSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WindowSummary[] {
    return this.inner.list();
  }
}

export function newCachedWindowSummaryStore(inner: WindowSummaryStore, ttl: number, clockValue: clock.Clock): WindowSummaryStore {
  return new CachedWindowSummaryStore(inner, cache.newTtlCache<WindowSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects window summaries. Empty fields match all. */
export class WindowSummaryQuery {
  channel: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minCeiling: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WindowSummary): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WindowSummary[]): WindowSummary[] {
    const matched = collections.filter(items, (candidate: WindowSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWindowSummaries(store: WindowSummaryStore, query: WindowSummaryQuery): WindowSummary[] {
  return query.apply(store.list());
}
