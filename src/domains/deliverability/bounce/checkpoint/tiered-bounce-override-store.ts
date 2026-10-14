import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBounceOverride } from "./tiered-bounce-override.js";

/** Keeps tiered bounce overrides by code. */
export interface TieredBounceOverrideStore {
  find(code: string): TieredBounceOverride | undefined;
  save(item: TieredBounceOverride): void;
  remove(code: string): boolean;
  list(): TieredBounceOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBounceOverrideStore implements TieredBounceOverrideStore {
  items: Map<string, TieredBounceOverride>;
  order: string[];

  constructor(items: Map<string, TieredBounceOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBounceOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBounceOverride): void {
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

  list(): TieredBounceOverride[] {
    const out: TieredBounceOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBounceOverrideStore(): TieredBounceOverrideStore {
  return new MemoryTieredBounceOverrideStore(new Map<string, TieredBounceOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBounceOverrideStore implements TieredBounceOverrideStore {
  inner: TieredBounceOverrideStore;
  cache: cache.TtlCache<TieredBounceOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBounceOverrideStore,
    cacheValue: cache.TtlCache<TieredBounceOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBounceOverride | undefined {
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

  save(item: TieredBounceOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBounceOverride[] {
    return this.inner.list();
  }
}

export function newCachedTieredBounceOverrideStore(inner: TieredBounceOverrideStore, ttl: number, clockValue: clock.Clock): TieredBounceOverrideStore {
  return new CachedTieredBounceOverrideStore(
    inner,
    cache.newTtlCache<TieredBounceOverride>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered bounce overrides. Empty fields match all. */
export class TieredBounceOverrideQuery {
  channel: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBudget: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBounceOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBounceOverride[]): TieredBounceOverride[] {
    const matched = collections.filter(items, (candidate: TieredBounceOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBounceOverrides(store: TieredBounceOverrideStore, query: TieredBounceOverrideQuery): TieredBounceOverride[] {
  return query.apply(store.list());
}
