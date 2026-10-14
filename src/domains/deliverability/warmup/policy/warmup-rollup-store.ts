import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupRollup } from "./warmup-rollup.js";

/** Keeps warmup rollups by code. */
export interface WarmupRollupStore {
  find(code: string): WarmupRollup | undefined;
  save(item: WarmupRollup): void;
  remove(code: string): boolean;
  list(): WarmupRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupRollupStore implements WarmupRollupStore {
  items: Map<string, WarmupRollup>;
  order: string[];

  constructor(items: Map<string, WarmupRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupRollup): void {
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

  list(): WarmupRollup[] {
    const out: WarmupRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupRollupStore(): WarmupRollupStore {
  return new MemoryWarmupRollupStore(new Map<string, WarmupRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupRollupStore implements WarmupRollupStore {
  inner: WarmupRollupStore;
  cache: cache.TtlCache<WarmupRollup>;
  hits: number;
  misses: number;

  constructor(inner: WarmupRollupStore, cacheValue: cache.TtlCache<WarmupRollup>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupRollup | undefined {
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

  save(item: WarmupRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupRollup[] {
    return this.inner.list();
  }
}

export function newCachedWarmupRollupStore(inner: WarmupRollupStore, ttl: number, clockValue: clock.Clock): WarmupRollupStore {
  return new CachedWarmupRollupStore(inner, cache.newTtlCache<WarmupRollup>(256, ttl, clockValue), 0, 0);
}

/** Selects warmup rollups. Empty fields match all. */
export class WarmupRollupQuery {
  channel: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minEndsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupRollup): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupRollup[]): WarmupRollup[] {
    const matched = collections.filter(items, (candidate: WarmupRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupRollups(store: WarmupRollupStore, query: WarmupRollupQuery): WarmupRollup[] {
  return query.apply(store.list());
}
