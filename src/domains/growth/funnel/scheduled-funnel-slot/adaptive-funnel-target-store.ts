import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

/** Keeps adaptive funnel targets by code. */
export interface AdaptiveFunnelTargetStore {
  find(code: string): AdaptiveFunnelTarget | undefined;
  save(item: AdaptiveFunnelTarget): void;
  remove(code: string): boolean;
  list(): AdaptiveFunnelTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveFunnelTargetStore implements AdaptiveFunnelTargetStore {
  items: Map<string, AdaptiveFunnelTarget>;
  order: string[];

  constructor(items: Map<string, AdaptiveFunnelTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveFunnelTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveFunnelTarget): void {
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

  list(): AdaptiveFunnelTarget[] {
    const out: AdaptiveFunnelTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveFunnelTargetStore(): AdaptiveFunnelTargetStore {
  return new MemoryAdaptiveFunnelTargetStore(new Map<string, AdaptiveFunnelTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveFunnelTargetStore implements AdaptiveFunnelTargetStore {
  inner: AdaptiveFunnelTargetStore;
  cache: cache.TtlCache<AdaptiveFunnelTarget>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveFunnelTargetStore,
    cacheValue: cache.TtlCache<AdaptiveFunnelTarget>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveFunnelTarget | undefined {
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

  save(item: AdaptiveFunnelTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveFunnelTarget[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveFunnelTargetStore(inner: AdaptiveFunnelTargetStore, ttl: number, clockValue: clock.Clock): AdaptiveFunnelTargetStore {
  return new CachedAdaptiveFunnelTargetStore(
    inner,
    cache.newTtlCache<AdaptiveFunnelTarget>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive funnel targets. Empty fields match all. */
export class AdaptiveFunnelTargetQuery {
  category: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minMaximum: number, statuses: string[], limit: number) {
    this.category = category;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveFunnelTarget): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveFunnelTarget[]): AdaptiveFunnelTarget[] {
    const matched = collections.filter(items, (candidate: AdaptiveFunnelTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveFunnelTargets(store: AdaptiveFunnelTargetStore, query: AdaptiveFunnelTargetQuery): AdaptiveFunnelTarget[] {
  return query.apply(store.list());
}
