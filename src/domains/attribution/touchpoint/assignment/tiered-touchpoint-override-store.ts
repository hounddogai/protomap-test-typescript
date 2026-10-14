import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredTouchpointOverride } from "./tiered-touchpoint-override.js";

/** Keeps tiered touchpoint overrides by code. */
export interface TieredTouchpointOverrideStore {
  find(code: string): TieredTouchpointOverride | undefined;
  save(item: TieredTouchpointOverride): void;
  remove(code: string): boolean;
  list(): TieredTouchpointOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredTouchpointOverrideStore implements TieredTouchpointOverrideStore {
  items: Map<string, TieredTouchpointOverride>;
  order: string[];

  constructor(items: Map<string, TieredTouchpointOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredTouchpointOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredTouchpointOverride): void {
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

  list(): TieredTouchpointOverride[] {
    const out: TieredTouchpointOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredTouchpointOverrideStore(): TieredTouchpointOverrideStore {
  return new MemoryTieredTouchpointOverrideStore(new Map<string, TieredTouchpointOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredTouchpointOverrideStore implements TieredTouchpointOverrideStore {
  inner: TieredTouchpointOverrideStore;
  cache: cache.TtlCache<TieredTouchpointOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredTouchpointOverrideStore,
    cacheValue: cache.TtlCache<TieredTouchpointOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredTouchpointOverride | undefined {
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

  save(item: TieredTouchpointOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredTouchpointOverride[] {
    return this.inner.list();
  }
}

export function newCachedTieredTouchpointOverrideStore(inner: TieredTouchpointOverrideStore, ttl: number, clockValue: clock.Clock): TieredTouchpointOverrideStore {
  return new CachedTieredTouchpointOverrideStore(
    inner,
    cache.newTtlCache<TieredTouchpointOverride>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered touchpoint overrides. Empty fields match all. */
export class TieredTouchpointOverrideQuery {
  source: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minScore: number, statuses: string[], limit: number) {
    this.source = source;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredTouchpointOverride): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredTouchpointOverride[]): TieredTouchpointOverride[] {
    const matched = collections.filter(items, (candidate: TieredTouchpointOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredTouchpointOverrides(store: TieredTouchpointOverrideStore, query: TieredTouchpointOverrideQuery): TieredTouchpointOverride[] {
  return query.apply(store.list());
}
