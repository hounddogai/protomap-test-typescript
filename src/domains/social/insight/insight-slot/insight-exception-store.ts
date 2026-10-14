import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightException } from "./insight-exception.js";

/** Keeps insight exceptions by code. */
export interface InsightExceptionStore {
  find(code: string): InsightException | undefined;
  save(item: InsightException): void;
  remove(code: string): boolean;
  list(): InsightException[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightExceptionStore implements InsightExceptionStore {
  items: Map<string, InsightException>;
  order: string[];

  constructor(items: Map<string, InsightException>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightException | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightException): void {
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

  list(): InsightException[] {
    const out: InsightException[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightExceptionStore(): InsightExceptionStore {
  return new MemoryInsightExceptionStore(new Map<string, InsightException>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightExceptionStore implements InsightExceptionStore {
  inner: InsightExceptionStore;
  cache: cache.TtlCache<InsightException>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightExceptionStore,
    cacheValue: cache.TtlCache<InsightException>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightException | undefined {
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

  save(item: InsightException): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightException[] {
    return this.inner.list();
  }
}

export function newCachedInsightExceptionStore(inner: InsightExceptionStore, ttl: number, clockValue: clock.Clock): InsightExceptionStore {
  return new CachedInsightExceptionStore(inner, cache.newTtlCache<InsightException>(512, ttl, clockValue), 0, 0);
}

/** Selects insight exceptions. Empty fields match all. */
export class InsightExceptionQuery {
  channel: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minScore: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightException): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightException[]): InsightException[] {
    const matched = collections.filter(items, (candidate: InsightException): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightExceptions(store: InsightExceptionStore, query: InsightExceptionQuery): InsightException[] {
  return query.apply(store.list());
}
