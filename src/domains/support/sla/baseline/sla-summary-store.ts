import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SlaSummary } from "./sla-summary.js";

/** Keeps sla summaries by code. */
export interface SlaSummaryStore {
  find(code: string): SlaSummary | undefined;
  save(item: SlaSummary): void;
  remove(code: string): boolean;
  list(): SlaSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySlaSummaryStore implements SlaSummaryStore {
  items: Map<string, SlaSummary>;
  order: string[];

  constructor(items: Map<string, SlaSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SlaSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SlaSummary): void {
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

  list(): SlaSummary[] {
    const out: SlaSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySlaSummaryStore(): SlaSummaryStore {
  return new MemorySlaSummaryStore(new Map<string, SlaSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSlaSummaryStore implements SlaSummaryStore {
  inner: SlaSummaryStore;
  cache: cache.TtlCache<SlaSummary>;
  hits: number;
  misses: number;

  constructor(inner: SlaSummaryStore, cacheValue: cache.TtlCache<SlaSummary>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SlaSummary | undefined {
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

  save(item: SlaSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SlaSummary[] {
    return this.inner.list();
  }
}

export function newCachedSlaSummaryStore(inner: SlaSummaryStore, ttl: number, clockValue: clock.Clock): SlaSummaryStore {
  return new CachedSlaSummaryStore(inner, cache.newTtlCache<SlaSummary>(128, ttl, clockValue), 0, 0);
}

/** Selects sla summaries. Empty fields match all. */
export class SlaSummaryQuery {
  utmSource: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minScore: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SlaSummary): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SlaSummary[]): SlaSummary[] {
    const matched = collections.filter(items, (candidate: SlaSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSlaSummaries(store: SlaSummaryStore, query: SlaSummaryQuery): SlaSummary[] {
  return query.apply(store.list());
}
