import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

/** Keeps adaptive subscription checkpoints by code. */
export interface AdaptiveSubscriptionCheckpointStore {
  find(code: string): AdaptiveSubscriptionCheckpoint | undefined;
  save(item: AdaptiveSubscriptionCheckpoint): void;
  remove(code: string): boolean;
  list(): AdaptiveSubscriptionCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveSubscriptionCheckpointStore implements AdaptiveSubscriptionCheckpointStore {
  items: Map<string, AdaptiveSubscriptionCheckpoint>;
  order: string[];

  constructor(items: Map<string, AdaptiveSubscriptionCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveSubscriptionCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveSubscriptionCheckpoint): void {
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

  list(): AdaptiveSubscriptionCheckpoint[] {
    const out: AdaptiveSubscriptionCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveSubscriptionCheckpointStore(): AdaptiveSubscriptionCheckpointStore {
  return new MemoryAdaptiveSubscriptionCheckpointStore(new Map<string, AdaptiveSubscriptionCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveSubscriptionCheckpointStore implements AdaptiveSubscriptionCheckpointStore {
  inner: AdaptiveSubscriptionCheckpointStore;
  cache: cache.TtlCache<AdaptiveSubscriptionCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveSubscriptionCheckpointStore,
    cacheValue: cache.TtlCache<AdaptiveSubscriptionCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveSubscriptionCheckpoint | undefined {
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

  save(item: AdaptiveSubscriptionCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveSubscriptionCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveSubscriptionCheckpointStore(inner: AdaptiveSubscriptionCheckpointStore, ttl: number, clockValue: clock.Clock): AdaptiveSubscriptionCheckpointStore {
  return new CachedAdaptiveSubscriptionCheckpointStore(
    inner,
    cache.newTtlCache<AdaptiveSubscriptionCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive subscription checkpoints. Empty fields match all. */
export class AdaptiveSubscriptionCheckpointQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveSubscriptionCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveSubscriptionCheckpoint[]): AdaptiveSubscriptionCheckpoint[] {
    const matched = collections.filter(items, (candidate: AdaptiveSubscriptionCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveSubscriptionCheckpoints(store: AdaptiveSubscriptionCheckpointStore, query: AdaptiveSubscriptionCheckpointQuery): AdaptiveSubscriptionCheckpoint[] {
  return query.apply(store.list());
}
