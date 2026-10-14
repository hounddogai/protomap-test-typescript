import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { InsightAdjustment } from "./insight-adjustment.js";

/** Keeps insight adjustments by code. */
export interface InsightAdjustmentStore {
  find(code: string): InsightAdjustment | undefined;
  save(item: InsightAdjustment): void;
  remove(code: string): boolean;
  list(): InsightAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryInsightAdjustmentStore implements InsightAdjustmentStore {
  items: Map<string, InsightAdjustment>;
  order: string[];

  constructor(items: Map<string, InsightAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): InsightAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: InsightAdjustment): void {
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

  list(): InsightAdjustment[] {
    const out: InsightAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryInsightAdjustmentStore(): InsightAdjustmentStore {
  return new MemoryInsightAdjustmentStore(new Map<string, InsightAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedInsightAdjustmentStore implements InsightAdjustmentStore {
  inner: InsightAdjustmentStore;
  cache: cache.TtlCache<InsightAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: InsightAdjustmentStore,
    cacheValue: cache.TtlCache<InsightAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): InsightAdjustment | undefined {
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

  save(item: InsightAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): InsightAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedInsightAdjustmentStore(inner: InsightAdjustmentStore, ttl: number, clockValue: clock.Clock): InsightAdjustmentStore {
  return new CachedInsightAdjustmentStore(inner, cache.newTtlCache<InsightAdjustment>(256, ttl, clockValue), 0, 0);
}

/** Selects insight adjustments. Empty fields match all. */
export class InsightAdjustmentQuery {
  channel: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMinimum: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: InsightAdjustment): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: InsightAdjustment[]): InsightAdjustment[] {
    const matched = collections.filter(items, (candidate: InsightAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findInsightAdjustments(store: InsightAdjustmentStore, query: InsightAdjustmentQuery): InsightAdjustment[] {
  return query.apply(store.list());
}
