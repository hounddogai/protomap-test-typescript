import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalInsightThreshold } from "./global-insight-threshold.js";

/** Keeps global insight thresholds by code. */
export interface GlobalInsightThresholdStore {
  find(code: string): GlobalInsightThreshold | undefined;
  save(item: GlobalInsightThreshold): void;
  remove(code: string): boolean;
  list(): GlobalInsightThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalInsightThresholdStore implements GlobalInsightThresholdStore {
  items: Map<string, GlobalInsightThreshold>;
  order: string[];

  constructor(items: Map<string, GlobalInsightThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalInsightThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalInsightThreshold): void {
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

  list(): GlobalInsightThreshold[] {
    const out: GlobalInsightThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalInsightThresholdStore(): GlobalInsightThresholdStore {
  return new MemoryGlobalInsightThresholdStore(new Map<string, GlobalInsightThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalInsightThresholdStore implements GlobalInsightThresholdStore {
  inner: GlobalInsightThresholdStore;
  cache: cache.TtlCache<GlobalInsightThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalInsightThresholdStore,
    cacheValue: cache.TtlCache<GlobalInsightThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalInsightThreshold | undefined {
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

  save(item: GlobalInsightThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalInsightThreshold[] {
    return this.inner.list();
  }
}

export function newCachedGlobalInsightThresholdStore(inner: GlobalInsightThresholdStore, ttl: number, clockValue: clock.Clock): GlobalInsightThresholdStore {
  return new CachedGlobalInsightThresholdStore(
    inner,
    cache.newTtlCache<GlobalInsightThreshold>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global insight thresholds. Empty fields match all. */
export class GlobalInsightThresholdQuery {
  title: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRetries: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalInsightThreshold): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalInsightThreshold[]): GlobalInsightThreshold[] {
    const matched = collections.filter(items, (candidate: GlobalInsightThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalInsightThresholds(store: GlobalInsightThresholdStore, query: GlobalInsightThresholdQuery): GlobalInsightThreshold[] {
  return query.apply(store.list());
}
