import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightThreshold } from "./insight-threshold.js";

/** Keeps insight thresholds by code. */
export interface InsightThresholdStore {
  find(code: string): InsightThreshold | undefined;
  save(item: InsightThreshold): void;
  remove(code: string): boolean;
  list(): InsightThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightThresholdStore implements InsightThresholdStore {
  items: Map<string, InsightThreshold>;
  order: string[];

  constructor(items: Map<string, InsightThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightThreshold): void {
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

  list(): InsightThreshold[] {
    const out: InsightThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightThresholdStore(): InsightThresholdStore {
  return new MemoryInsightThresholdStore(new Map<string, InsightThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightThresholdStore implements InsightThresholdStore {
  inner: InsightThresholdStore;
  cache: cache.TtlCache<InsightThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightThresholdStore,
    cacheValue: cache.TtlCache<InsightThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightThreshold | undefined {
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

  save(item: InsightThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightThreshold[] {
    return this.inner.list();
  }
}

export function newCachedInsightThresholdStore(inner: InsightThresholdStore, ttl: number, clockValue: clock.Clock): InsightThresholdStore {
  return new CachedInsightThresholdStore(inner, cache.newTtlCache<InsightThreshold>(128, ttl, clockValue), 0, 0);
}

/** Selects insight thresholds. Empty fields match all. */
export class InsightThresholdQuery {
  utmSource: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightThreshold): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightThreshold[]): InsightThreshold[] {
    const matched = collections.filter(items, (candidate: InsightThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightThresholds(store: InsightThresholdStore, query: InsightThresholdQuery): InsightThreshold[] {
  return query.apply(store.list());
}
