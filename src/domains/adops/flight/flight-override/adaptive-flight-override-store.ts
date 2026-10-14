import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFlightOverride } from "./adaptive-flight-override.js";

/** Keeps adaptive flight overrides by code. */
export interface AdaptiveFlightOverrideStore {
  find(code: string): AdaptiveFlightOverride | undefined;
  save(item: AdaptiveFlightOverride): void;
  remove(code: string): boolean;
  list(): AdaptiveFlightOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFlightOverrideStore implements AdaptiveFlightOverrideStore {
  items: Map<string, AdaptiveFlightOverride>;
  order: string[];

  constructor(items: Map<string, AdaptiveFlightOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFlightOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFlightOverride): void {
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

  list(): AdaptiveFlightOverride[] {
    const out: AdaptiveFlightOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFlightOverrideStore(): AdaptiveFlightOverrideStore {
  return new MemoryAdaptiveFlightOverrideStore(new Map<string, AdaptiveFlightOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFlightOverrideStore implements AdaptiveFlightOverrideStore {
  inner: AdaptiveFlightOverrideStore;
  cache: cache.TtlCache<AdaptiveFlightOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFlightOverrideStore,
    cacheValue: cache.TtlCache<AdaptiveFlightOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFlightOverride | undefined {
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

  save(item: AdaptiveFlightOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFlightOverride[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFlightOverrideStore(inner: AdaptiveFlightOverrideStore, ttl: number, clockValue: clock.Clock): AdaptiveFlightOverrideStore {
  return new CachedAdaptiveFlightOverrideStore(
    inner,
    cache.newTtlCache<AdaptiveFlightOverride>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive flight overrides. Empty fields match all. */
export class AdaptiveFlightOverrideQuery {
  channel: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFlightOverride): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFlightOverride[]): AdaptiveFlightOverride[] {
    const matched = collections.filter(items, (candidate: AdaptiveFlightOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFlightOverrides(store: AdaptiveFlightOverrideStore, query: AdaptiveFlightOverrideQuery): AdaptiveFlightOverride[] {
  return query.apply(store.list());
}
