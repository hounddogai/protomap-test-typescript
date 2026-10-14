import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingModelRollup } from "./pending-model-rollup.js";

/** Keeps pending model rollups by code. */
export interface PendingModelRollupStore {
  find(code: string): PendingModelRollup | undefined;
  save(item: PendingModelRollup): void;
  remove(code: string): boolean;
  list(): PendingModelRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingModelRollupStore implements PendingModelRollupStore {
  items: Map<string, PendingModelRollup>;
  order: string[];

  constructor(items: Map<string, PendingModelRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingModelRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingModelRollup): void {
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

  list(): PendingModelRollup[] {
    const out: PendingModelRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingModelRollupStore(): PendingModelRollupStore {
  return new MemoryPendingModelRollupStore(new Map<string, PendingModelRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingModelRollupStore implements PendingModelRollupStore {
  inner: PendingModelRollupStore;
  cache: cache.TtlCache<PendingModelRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingModelRollupStore,
    cacheValue: cache.TtlCache<PendingModelRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingModelRollup | undefined {
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

  save(item: PendingModelRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingModelRollup[] {
    return this.inner.list();
  }
}

export function newCachedPendingModelRollupStore(inner: PendingModelRollupStore, ttl: number, clockValue: clock.Clock): PendingModelRollupStore {
  return new CachedPendingModelRollupStore(inner, cache.newTtlCache<PendingModelRollup>(1024, ttl, clockValue), 0, 0);
}

/** Selects pending model rollups. Empty fields match all. */
export class PendingModelRollupQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingModelRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingModelRollup[]): PendingModelRollup[] {
    const matched = collections.filter(items, (candidate: PendingModelRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingModelRollups(store: PendingModelRollupStore, query: PendingModelRollupQuery): PendingModelRollup[] {
  return query.apply(store.list());
}
