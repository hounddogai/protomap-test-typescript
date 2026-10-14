import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledFunnelBundle } from "./scheduled-funnel-bundle.js";

/** Keeps scheduled funnel bundles by code. */
export interface ScheduledFunnelBundleStore {
  find(code: string): ScheduledFunnelBundle | undefined;
  save(item: ScheduledFunnelBundle): void;
  remove(code: string): boolean;
  list(): ScheduledFunnelBundle[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledFunnelBundleStore implements ScheduledFunnelBundleStore {
  items: Map<string, ScheduledFunnelBundle>;
  order: string[];

  constructor(items: Map<string, ScheduledFunnelBundle>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledFunnelBundle | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledFunnelBundle): void {
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

  list(): ScheduledFunnelBundle[] {
    const out: ScheduledFunnelBundle[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledFunnelBundleStore(): ScheduledFunnelBundleStore {
  return new MemoryScheduledFunnelBundleStore(new Map<string, ScheduledFunnelBundle>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledFunnelBundleStore implements ScheduledFunnelBundleStore {
  inner: ScheduledFunnelBundleStore;
  cache: cache.TtlCache<ScheduledFunnelBundle>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledFunnelBundleStore,
    cacheValue: cache.TtlCache<ScheduledFunnelBundle>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledFunnelBundle | undefined {
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

  save(item: ScheduledFunnelBundle): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledFunnelBundle[] {
    return this.inner.list();
  }
}

export function newCachedScheduledFunnelBundleStore(inner: ScheduledFunnelBundleStore, ttl: number, clockValue: clock.Clock): ScheduledFunnelBundleStore {
  return new CachedScheduledFunnelBundleStore(
    inner,
    cache.newTtlCache<ScheduledFunnelBundle>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled funnel bundles. Empty fields match all. */
export class ScheduledFunnelBundleQuery {
  category: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBatchSize: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledFunnelBundle): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledFunnelBundle[]): ScheduledFunnelBundle[] {
    const matched = collections.filter(items, (candidate: ScheduledFunnelBundle): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledFunnelBundles(store: ScheduledFunnelBundleStore, query: ScheduledFunnelBundleQuery): ScheduledFunnelBundle[] {
  return query.apply(store.list());
}
