import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

/** Keeps adaptive invite adjustments by code. */
export interface AdaptiveInviteAdjustmentStore {
  find(code: string): AdaptiveInviteAdjustment | undefined;
  save(item: AdaptiveInviteAdjustment): void;
  remove(code: string): boolean;
  list(): AdaptiveInviteAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveInviteAdjustmentStore implements AdaptiveInviteAdjustmentStore {
  items: Map<string, AdaptiveInviteAdjustment>;
  order: string[];

  constructor(items: Map<string, AdaptiveInviteAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveInviteAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveInviteAdjustment): void {
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

  list(): AdaptiveInviteAdjustment[] {
    const out: AdaptiveInviteAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveInviteAdjustmentStore(): AdaptiveInviteAdjustmentStore {
  return new MemoryAdaptiveInviteAdjustmentStore(new Map<string, AdaptiveInviteAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveInviteAdjustmentStore implements AdaptiveInviteAdjustmentStore {
  inner: AdaptiveInviteAdjustmentStore;
  cache: cache.TtlCache<AdaptiveInviteAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveInviteAdjustmentStore,
    cacheValue: cache.TtlCache<AdaptiveInviteAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveInviteAdjustment | undefined {
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

  save(item: AdaptiveInviteAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveInviteAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveInviteAdjustmentStore(inner: AdaptiveInviteAdjustmentStore, ttl: number, clockValue: clock.Clock): AdaptiveInviteAdjustmentStore {
  return new CachedAdaptiveInviteAdjustmentStore(
    inner,
    cache.newTtlCache<AdaptiveInviteAdjustment>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive invite adjustments. Empty fields match all. */
export class AdaptiveInviteAdjustmentQuery {
  name: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minThreshold: number, statuses: string[], limit: number) {
    this.name = name;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveInviteAdjustment): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveInviteAdjustment[]): AdaptiveInviteAdjustment[] {
    const matched = collections.filter(items, (candidate: AdaptiveInviteAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveInviteAdjustments(store: AdaptiveInviteAdjustmentStore, query: AdaptiveInviteAdjustmentQuery): AdaptiveInviteAdjustment[] {
  return query.apply(store.list());
}
